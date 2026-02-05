import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "thumbnail", "status", "variants.id", "variants.title"],
    pagination: {
      take: 200,
      skip: 0,
    },
  })

  const products = (data || [])
    .filter((product: { status?: string }) => product.status === "published")
    .filter((product: { variants?: unknown[] }) => (product.variants || []).length > 0)

  res.status(200).json({ products })
}
