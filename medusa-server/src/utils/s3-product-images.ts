import {
  DeleteObjectsCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3"
import { MedusaError } from "@medusajs/framework/utils"

type Logger = {
  error: (...args: unknown[]) => void
  info?: (...args: unknown[]) => void
  warn?: (...args: unknown[]) => void
}

type S3CleanupConfig = {
  bucket: string
  fileUrl?: string
  region?: string
  endpoint?: string
  prefix?: string
  accessKeyId?: string
  secretAccessKey?: string
  forcePathStyle?: boolean
}

type DeleteS3ProductImagesInput = {
  keys: string[]
  logger?: Logger
}

const S3_DELETE_OBJECT_LIMIT = 1000

const toBoolean = (value?: string) => {
  if (!value) {
    return undefined
  }

  return ["1", "true", "yes"].includes(value.toLowerCase())
}

const normalizePrefix = (prefix?: string) => {
  return (prefix || "").replace(/^\/+/, "")
}

const safeDecodeURIComponent = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const getS3CleanupConfig = (): S3CleanupConfig => {
  return {
    bucket: process.env.S3_BUCKET || "",
    fileUrl: process.env.S3_FILE_URL,
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    prefix: normalizePrefix(process.env.S3_PREFIX),
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    forcePathStyle: toBoolean(process.env.S3_FORCE_PATH_STYLE),
  }
}

const createS3Client = (config: S3CleanupConfig) => {
  const credentials =
    config.accessKeyId && config.secretAccessKey
      ? {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        }
      : undefined

  const clientConfig: S3ClientConfig = {
    credentials,
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
  }

  return new S3Client(clientConfig)
}

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

const getKeyFromConfiguredFileUrl = (
  url: URL,
  configuredFileUrl?: string
) => {
  if (!configuredFileUrl) {
    return null
  }

  let baseUrl: URL

  try {
    baseUrl = new URL(configuredFileUrl)
  } catch {
    return null
  }

  if (url.origin !== baseUrl.origin) {
    return null
  }

  const basePath = baseUrl.pathname.replace(/\/+$/, "")
  const urlPath = url.pathname

  if (basePath && basePath !== "/" && !urlPath.startsWith(`${basePath}/`)) {
    return null
  }

  return urlPath.slice(basePath === "/" ? 1 : basePath.length + 1)
}

const getKeyFromBucketUrl = (url: URL, config: S3CleanupConfig) => {
  const bucket = config.bucket

  if (!bucket) {
    return null
  }

  // Supports virtual-hosted-style URLs, such as
  // https://my-bucket.s3.amazonaws.com/path/to/file.png.
  if (url.hostname === `${bucket}.s3.amazonaws.com`) {
    return url.pathname.slice(1)
  }

  if (url.hostname.startsWith(`${bucket}.s3.`)) {
    return url.pathname.slice(1)
  }

  let endpointHost: string | null = null

  try {
    endpointHost = config.endpoint ? new URL(config.endpoint).hostname : null
  } catch {
    endpointHost = null
  }

  const isKnownS3Host = url.hostname.includes("s3") || url.hostname === endpointHost

  // Supports path-style URLs, such as
  // https://s3.amazonaws.com/my-bucket/path/to/file.png.
  const pathParts = url.pathname.replace(/^\/+/, "").split("/")
  if (isKnownS3Host && pathParts[0] === bucket) {
    return pathParts.slice(1).join("/")
  }

  return null
}

const keyMatchesPrefix = (key: string, prefix?: string) => {
  return !prefix || key.startsWith(prefix)
}

export const extractS3ObjectKey = (
  value: string | null | undefined,
  config: S3CleanupConfig = getS3CleanupConfig()
) => {
  const rawValue = value?.trim()

  if (!rawValue) {
    return null
  }

  let key: string | null = null

  try {
    const url = new URL(rawValue)
    key =
      getKeyFromConfiguredFileUrl(url, config.fileUrl) ||
      getKeyFromBucketUrl(url, config)
  } catch {
    // Product images may already contain S3 object keys instead of URLs.
    key = rawValue.replace(/^\/+/, "")
  }

  if (!key) {
    return null
  }

  const decodedKey = safeDecodeURIComponent(key).replace(/^\/+/, "")

  if (!keyMatchesPrefix(decodedKey, config.prefix)) {
    return null
  }

  return decodedKey
}

export const getProductImageKeysForS3Cleanup = (
  imageReferences: Array<string | null | undefined>
) => {
  const config = getS3CleanupConfig()
  const keys = imageReferences
    .map((reference) => extractS3ObjectKey(reference, config))
    .filter((key): key is string => !!key)

  return Array.from(new Set(keys))
}

export const deleteS3ProductImages = async ({
  keys,
  logger,
}: DeleteS3ProductImagesInput) => {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))

  if (!uniqueKeys.length) {
    logger?.info?.("No S3 product image keys found for cleanup.")

    return {
      deleted: [],
      skipped: true,
    }
  }

  const config = getS3CleanupConfig()

  if (!config.bucket) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "S3_BUCKET is required to delete product images from S3."
    )
  }

  const s3Client = createS3Client(config)
  const deleted: string[] = []

  try {
    logger?.info?.(
      `Deleting ${uniqueKeys.length} product image object(s) from S3 bucket ${config.bucket}.`
    )

    for (const keyChunk of chunk(uniqueKeys, S3_DELETE_OBJECT_LIMIT)) {
      logger?.info?.(
        `Deleting S3 product image batch with ${keyChunk.length} object(s).`
      )

      const result = await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: config.bucket,
          Delete: {
            Objects: keyChunk.map((key) => ({ Key: key })),
            Quiet: false,
          },
        })
      )

      if (result.Errors?.length) {
        const failedKeys = result.Errors.map((error) => error.Key).filter(
          (key): key is string => !!key
        )

        throw new MedusaError(
          MedusaError.Types.UNEXPECTED_STATE,
          `Failed to delete ${failedKeys.length} product image(s) from S3: ${failedKeys.join(", ")}`
        )
      }

      deleted.push(...keyChunk)
    }

    logger?.info?.(
      `Deleted ${deleted.length} product image object(s) from S3 bucket ${config.bucket}.`
    )
  } catch (error) {
    logger?.error("Failed to delete product images from S3 before product delete.")
    logger?.error(error)
    throw error
  } finally {
    s3Client.destroy()
  }

  return {
    deleted,
    skipped: false,
  }
}
