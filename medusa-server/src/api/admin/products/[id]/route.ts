import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import { BUNDLE_MODULE } from "../../../../modules/bundle"
import {
  deleteS3ProductImages,
  getProductImageKeysForS3Cleanup,
} from "../../../../utils/s3-product-images"

// Changed:
// route.ts (line 23)
// Keeps the existing bundle guard first.
// Retrieves thumbnail and images.url before deletion.
// Deletes S3 objects before deleting the product.
// Stops product deletion if S3 cleanup fails.
// Uses Medusa’s deleteProductsWorkflow instead of direct productModuleService.deleteProducts.

// s3-product-images.ts (line 1)
// Reusable AWS SDK v3 cleanup utility.
// Reads S3_BUCKET, S3_FILE_URL, S3_REGION, S3_ENDPOINT, S3_PREFIX, credentials, and optional S3_FORCE_PATH_STYLE.
// Supports multiple images, dedupes keys, handles encoded URLs, raw keys, configured file URL, virtual-hosted S3 URLs, and path-style S3 URLs.
// Checks DeleteObjectsCommand partial failures and throws if any key fails.

// package.json (line 25)
// Added direct dependency on @aws-sdk/client-s3.











type ProductImageReference = {
  url?: string | null
}

type ProductForImageCleanup = {
  id: string
  thumbnail?: string | null
  images?: ProductImageReference[] | null
}

const retrieveProductForImageCleanup = async (
  req: MedusaRequest,
  productId: string
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "thumbnail", "images.url"],
    filters: {
      id: [productId],
    },
  })

  return (data || [])[0] as ProductForImageCleanup | undefined
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)

  logger.info(`Starting admin product delete for ${productId}.`)

  const bundleItems = await bundleModuleService.listBundleItems({
    product_id: productId,
  })

  if (bundleItems?.length) {
    logger.warn(
      `Blocked product delete for ${productId}; product is used in ${bundleItems.length} bundle item(s).`
    )

    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Product ${productId} is used in ${bundleItems.length} bundle item(s). Remove it from bundles first.`
    )
  }

  const product = await retrieveProductForImageCleanup(req, productId)

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product ${productId} wasn't found`
    )
  }

  logger.info(
    `Retrieved product ${productId} for image cleanup with ${(product.images || []).length} image record(s).`
  )

  const imageKeys = getProductImageKeysForS3Cleanup([
    product.thumbnail,
    ...(product.images || []).map((image) => image.url),
  ])

  logger.info(
    `Resolved ${imageKeys.length} S3 image key(s) for product ${productId}.`
  )

  try {
    await deleteS3ProductImages({
      keys: imageKeys,
      logger,
    })
  } catch (error) {
    logger.error(
      `Product ${productId} was not deleted because S3 image cleanup failed.`
    )

    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Could not delete product images from S3. Product ${productId} was not deleted.`
    )
  }

  await deleteProductsWorkflow(req.scope).run({
    input: {
      ids: [productId],
    },
  })

  logger.info(`Deleted product ${productId} after S3 image cleanup.`)

  res.status(200).json({
    id: productId,
    object: "product",
    deleted: true,
  })
}
