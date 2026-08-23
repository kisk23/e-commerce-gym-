import { ExecArgs } from "@medusajs/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  HeadObjectCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3"
import fs from "fs"
import path from "path"

/**
 * Repairs stored image URLs and migrates legacy local files into S3.
 *
 * Pass 1 - Legacy local-provider migration:
 *   http://localhost:9000/static/<Date.now()>-<filename>
 *   -> uploaded to ${S3_FILE_URL}<filename> and rows rewritten.
 *
 * Pass 2 - Double-slash repair:
 *   A trailing slash in S3_FILE_URL made @medusajs/file-s3 generate
 *   https://bucket//key URLs (S3 responds AccessDenied). Collapses
 *   https://host//key back to https://host/key.
 *
 * Safe to run anywhere (locally or on Railway):
 *   1. Objects already present in S3 are reused (ACL re-enforced), no local file needed.
 *   2. Missing local files are fetched from ${MEDUSA_BACKEND_URL}/static/ as a fallback.
 *   3. Rows are only rewritten once the object is confirmed available in S3.
 *
 * Run with: npx medusa exec ./src/scripts/migrate-local-images-to-s3.ts
 */

const LEGACY_URL_PREFIX = "http://localhost:9000/static/"

// Matches accidental duplicate slashes right after the origin, e.g.
// https://bucket.s3.amazonaws.com//key or ...com///key
const MULTIPLE_SLASHES_AFTER_ORIGIN = /^(https?:\/\/[^/]+)\/{2,}(?=.)/

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
}

// Tables/columns that can hold image URLs, with soft-delete support flag.
const TARGETS: Array<{
  table: string
  column: string
  hasSoftDelete: boolean
}> = [
  { table: "image", column: "url", hasSoftDelete: true },
  { table: "product", column: "thumbnail", hasSoftDelete: true },
  { table: "cart_line_item", column: "thumbnail", hasSoftDelete: false },
  { table: "order_line_item", column: "thumbnail", hasSoftDelete: false },
  // Bundle items copy product.thumbnail at bundle creation time, so they can
  // still hold legacy/double-slash URLs even after products were repaired.
  { table: "bundle_item", column: "thumbnail", hasSoftDelete: false },
  { table: "order_claim_item_image", column: "url", hasSoftDelete: true },
]

type Row = { id: string; value: string }

const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const fetchStaticFile = async (filename: string): Promise<Buffer | null> => {
  const backendUrl = process.env.MEDUSA_BACKEND_URL
  if (!backendUrl) {
    return null
  }

  try {
    const response = await fetch(
      `${backendUrl}/static/${encodeURIComponent(filename)}`
    )
    if (!response.ok) {
      return null
    }
    return Buffer.from(await response.arrayBuffer())
  } catch {
    return null
  }
}

export default async function migrateLocalImagesToS3({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const bucket = process.env.S3_BUCKET
  const region = process.env.S3_REGION
  // Tolerate a trailing slash; the provider bug this script repairs came
  // from exactly that env format.
  const fileUrl = (process.env.S3_FILE_URL || "").replace(/\/+$/, "")

  if (!bucket || !region || !fileUrl) {
    throw new Error(
      "S3_BUCKET, S3_REGION and S3_FILE_URL must be configured before running this migration."
    )
  }

  /* ------------------------------------------------------------------ *
   * Pass 2a - repair double-slash URLs (cheap, run first so legacy pass
   * compares against canonical URLs).
   * ------------------------------------------------------------------ */
  let repairedRows = 0

  for (const target of TARGETS) {
    const candidates = (await db(target.table)
      .where(target.column, "like", "http%")
      .select({
        id: "id",
        value: target.column,
      })) as Row[]

    let updated = 0
    for (const row of candidates) {
      if (!MULTIPLE_SLASHES_AFTER_ORIGIN.test(row.value)) {
        continue
      }

      await db(target.table)
        .where({ id: row.id })
        .update({ [target.column]: row.value.replace(MULTIPLE_SLASHES_AFTER_ORIGIN, "$1/") })
      updated++
    }

    if (updated) {
      logger.info(
        `Repaired ${updated} double-slash URL(s) in ${target.table}.${target.column}.`
      )
    }
    repairedRows += updated
  }

  /* ------------------------------------------------------------------ *
   * Pass 2b - migrate legacy local-provider references into S3.
   * ------------------------------------------------------------------ */
  const rowsByTarget: Record<string, Row[]> = {}
  let totalRefs = 0

  for (const target of TARGETS) {
    let query = db(target.table).where(
      target.column,
      "like",
      `${LEGACY_URL_PREFIX}%`
    )
    if (target.hasSoftDelete) {
      query = query.whereNull("deleted_at")
    }

    const rows = (await query.select({
      id: "id",
      value: target.column,
    })) as Row[]

    rowsByTarget[`${target.table}.${target.column}`] = rows
    totalRefs += rows.length

    if (rows.length) {
      logger.info(
        `Found ${rows.length} legacy reference(s) in ${target.table}.${target.column}.`
      )
    }
  }

  let uploadedCount = 0
  let reusedCount = 0

  if (!totalRefs) {
    logger.info("No legacy localhost static image URLs found.")
  } else {
    const clientConfig: S3ClientConfig = { region }
    if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
      clientConfig.credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      }
    }
    const s3 = new S3Client(clientConfig)

    const staticDir = path.join(process.cwd(), "static")
    const availableFilenames = new Set<string>()

    const filenames = Array.from(
      new Set(
        Object.values(rowsByTarget)
          .flat()
          .map((row) =>
            safeDecodeURIComponent(row.value.slice(LEGACY_URL_PREFIX.length))
          )
      )
    )

    for (const filename of filenames) {
      // 1. Object already in the bucket? Ensure it is publicly readable and reuse it.
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: filename }))
        try {
          await s3.send(
            new PutObjectAclCommand({
              Bucket: bucket,
              Key: filename,
              ACL: "public-read",
            })
          )
        } catch (aclError) {
          // Buckets with Object Ownership enforced ignore ACLs; public access
          // is then granted by bucket policy instead. Do not fail the migration.
          logger.warn(
            `Could not apply public-read ACL to ${filename} (${
              (aclError as Error).message
            }); continuing.`
          )
        }
        reusedCount++
        availableFilenames.add(filename)
        logger.info(`Already present in S3, reusing: ${filename}`)
        continue
      } catch (headError) {
        const status = (
          headError as { $metadata?: { httpStatusCode?: number } }
        )?.$metadata?.httpStatusCode
        if (status && status !== 404 && status !== 403) {
          logger.warn(
            `Skipping ${filename}: unexpected HEAD response ${status}.`
          )
          continue
        }
        // 404/403 -> object treated as missing, fall through to upload below.
      }

      // 2. Read the bytes from local disk; fall back to the deployed backend.
      const localPath = path.join(staticDir, filename)
      let body: Buffer | null = null

      if (fs.existsSync(localPath)) {
        body = fs.readFileSync(localPath)
      } else {
        logger.info(
          `${filename} not on disk, trying backend /static fallback...`
        )
        body = await fetchStaticFile(filename)
      }

      if (!body) {
        logger.warn(
          `Referenced file could not be located locally or remotely, leaving row untouched: ${filename}`
        )
        continue
      }

      // 3. Upload with the same metadata/ACL the file provider uses for public files.
      try {
        const ext = path.extname(filename).toLowerCase()
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: filename,
            Body: body,
            ContentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
            CacheControl:
              process.env.S3_CACHE_CONTROL || "public, max-age=31536000",
            ACL: "public-read",
          })
        )
        uploadedCount++
        availableFilenames.add(filename)
        logger.info(`Uploaded to S3: ${filename}`)
      } catch (uploadError) {
        logger.warn(
          `Failed to upload ${filename}, leaving rows untouched: ${
            (uploadError as Error).message
          }`
        )
      }
    }

    await s3.destroy()

    // 4. Rewrite only rows whose object is confirmed available in S3.
    let updatedTotal = 0

    for (const target of TARGETS) {
      const rows = rowsByTarget[`${target.table}.${target.column}`]
      let updated = 0

      for (const row of rows) {
        const filename = safeDecodeURIComponent(
          row.value.slice(LEGACY_URL_PREFIX.length)
        )
        if (!availableFilenames.has(filename)) {
          continue
        }

        await db(target.table)
          .where({ id: row.id })
          .update({
            [target.column]: `${fileUrl}/${encodeURIComponent(filename)}`,
          })
        updated++
      }

      updatedTotal += updated
      if (updated) {
        logger.info(
          `Updated ${updated} row(s) in ${target.table}.${target.column}.`
        )
      }
    }

    logger.info(
      `Legacy migration finished. Uploaded ${uploadedCount} object(s), reused ${reusedCount}. Updated ${updatedTotal} row(s).`
    )
  }

  if (!repairedRows && !uploadedCount && !reusedCount) {
    logger.info("Nothing to repair. Database image URLs are healthy.")
  } else {
    logger.info(
      `All done. Double-slash repairs: ${repairedRows} row(s). Legacy migration: uploaded ${uploadedCount}, reused ${reusedCount}.`
    )
  }
}
