import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/types"
import { BUNDLE_MODULE } from "../../../../modules/bundle"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id
  const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)
  const productModuleService: IProductModuleService = req.scope.resolve(
    Modules.PRODUCT
  )

  const bundleItems = await bundleModuleService.listBundleItems({
    product_id: productId,
  })

  if (bundleItems?.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Product ${productId} is used in ${bundleItems.length} bundle item(s). Remove it from bundles first.`
    )
  }

  await productModuleService.deleteProducts([productId])

  res.status(200).json({
    id: productId,
    object: "product",
    deleted: true,
  })
}
