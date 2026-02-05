import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BUNDLE_MODULE } from "../../../modules/bundle"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)
  const bundles = await bundleModuleService.listBundles(
    {
      is_active: true,
    },
    {
      relations: ["items"],
    }
  )

  res.status(200).json({ bundles })
}
