import {
  authenticate,
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import helmet from "helmet"
import {
  deleteS3ProductImages,
  getProductImageKeysForS3Cleanup,
} from "../utils/s3-product-images"

const isProduction = process.env.NODE_ENV === "production"

const helmetHandler = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: isProduction
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
})

const helmetMiddleware = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  return helmetHandler(req, res, next)
}

/* ---------------------------------------------------------------------- *
 * S3 cleanup for detached product images.
 *
 * The admin dashboard only detaches image URLs when a product is updated;
 * the underlying file is never deleted from storage. This middleware
 * snapshots the product's thumbnail/images before an update, and once the
 * response finishes successfully, deletes any removed URL's S3 object -
 * but only if no other table still references that exact URL.
 * ---------------------------------------------------------------------- */

type ProductImageSnapshot = {
  thumbnail?: string | null
  images?: Array<{ url?: string | null }> | null
}

const captureProductImageUrls = async (
  req: MedusaRequest,
  productId: string
): Promise<string[]> => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "thumbnail", "images.url"],
    filters: {
      id: [productId],
    },
  })

  const product = (data || [])[0] as ProductImageSnapshot | undefined

  return [
    product?.thumbnail,
    ...(product?.images || []).map((image) => image.url),
  ].filter((url): url is string => !!url)
}

// Tables that may legally keep referencing an image after it was detached
// from one product (exact URL match).
const REFERENCE_CHECKS: Array<{
  table: string
  column: string
  hasSoftDelete: boolean
}> = [
  { table: "image", column: "url", hasSoftDelete: true },
  { table: "product", column: "thumbnail", hasSoftDelete: true },
  { table: "cart_line_item", column: "thumbnail", hasSoftDelete: false },
  { table: "order_line_item", column: "thumbnail", hasSoftDelete: false },
  { table: "bundle_item", column: "thumbnail", hasSoftDelete: false },
]

const isUrlStillReferenced = async (req: MedusaRequest, url: string) => {
  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  for (const target of REFERENCE_CHECKS) {
    let query = db(target.table).where(target.column, url).limit(1)
    if (target.hasSoftDelete) {
      query = query.whereNull("deleted_at")
    }

    const rows = await query
    if (rows.length) {
      return true
    }
  }

  return false
}

const s3DetachedImageCleanupMiddleware = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const productId = req.params?.id
  const isProductUpdate = ["POST", "PUT", "PATCH"].includes(
    req.method || ""
  )

  if (!productId || !isProductUpdate) {
    return next()
  }

  void (async () => {
    let beforeUrls: string[] = []

    try {
      beforeUrls = await captureProductImageUrls(req, productId)
    } catch {
      // Snapshot failures must never break the admin request.
      return next()
    }

    res.on("finish", () => {
      void (async () => {
        try {
          if (res.statusCode >= 400) {
            return
          }

          const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
          const afterUrls = await captureProductImageUrls(req, productId)
          const afterSet = new Set(afterUrls)

          const removedUrls = beforeUrls.filter((url) => !afterSet.has(url))
          if (!removedUrls.length) {
            return
          }

          // Keep URLs that other records still reference.
          const deletableUrls: string[] = []
          for (const url of removedUrls) {
            if (!(await isUrlStillReferenced(req, url))) {
              deletableUrls.push(url)
            }
          }
          if (!deletableUrls.length) {
            logger.info(
              `Skipped S3 cleanup for product ${productId}: removed image(s) are still referenced elsewhere.`
            )
            return
          }

          const keys = getProductImageKeysForS3Cleanup(deletableUrls)
          if (!keys.length) {
            logger.info(
              `Removed image(s) for product ${productId} are not stored in the configured S3 bucket; nothing to delete.`
            )
            return
          }

          logger.info(
            `Deleting ${keys.length} detached image object(s) from S3 after product ${productId} update.`
          )
          await deleteS3ProductImages({ keys, logger })
          logger.info(
            `S3 cleanup for product ${productId} completed (${keys.length} object(s) deleted).`
          )
        } catch (error) {
          const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
          logger.error(
            `Failed S3 cleanup after product ${productId} update; objects may remain orphaned.`
          )
          logger.error(error)
        }
      })()
    })

    next()
  })()
}

export default defineMiddlewares({
  routes: [
    // Phase 1: Global security headers (no CSP)
    {
      matcher: "*",
      middlewares: [helmetMiddleware],
    },
    {
      matcher: "/admin/products/:id",
      middlewares: [s3DetachedImageCleanupMiddleware],
    },
    {
      matcher: "/admin/bundles/*",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: "/admin/subscriptions/*",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: "/store/customers/me/subscriptions/*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/carts/:id/subscription-plan",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/carts/:id/subscription-discount",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/email-verification/status",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/email-verification/resend",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
  ],
})
