import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "thumbnail",
      "status",
      "metadata",
      "variants.id",
      "variants.title",
      "variants.price_set.prices.amount",
      "variants.price_set.prices.currency_code",
      "variants.price_set.prices.price_list_id",
    ],
    pagination: {
      take: 200,
      skip: 0,
    },
  })

  const products = (data || [])
    .filter((product: { status?: string }) => product.status === "published")
    .filter((product: { variants?: unknown[] }) => (product.variants || []).length > 0)

  const storeResult = await query.graph({
    entity: "store",
    fields: ["id", "supported_currencies.currency_code", "supported_currencies.is_default"],
  })
  const supportedCurrencies =
    (storeResult.data || [])[0]?.supported_currencies || []
  const defaultCurrency =
    supportedCurrencies.find((currency) => currency?.is_default)?.currency_code ||
    supportedCurrencies.find((currency) => currency?.currency_code)?.currency_code ||
    "aed"

  res.status(200).json({ products, currency_code: defaultCurrency })
}
