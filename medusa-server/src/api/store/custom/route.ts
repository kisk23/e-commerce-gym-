import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listBundles } from "../../../lib/vegetable-bundles"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.status(200).json({ bundles: listBundles() })
}
