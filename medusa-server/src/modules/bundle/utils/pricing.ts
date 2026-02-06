

type VariantPriceQueryResponse = {
  data: {
    id: string
    price_set?: {
      prices?: {
        amount: number
        currency_code: string
        price_list_id?: string | null
      }[]
    } | null
  }[]
}

type VariantPrice = {
  amount: number
  currency_code: string
  price_list_id?: string | null
}

type VariantPrices = VariantPrice[] | null | undefined

export const roundValue = (value: number) => Math.round(value * 100) / 100
export const normalizeCurrencyCode = (value?: string | null) =>
  typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null

export const pickVariantPrice = (
  prices: VariantPrices,
  currencyCode?: string | null
) => {
  const normalizedCurrency = normalizeCurrencyCode(currencyCode)
  const validPrices = (prices || []).filter(
    (price): price is { amount: number; currency_code: string; price_list_id?: string | null } =>
      !!price && typeof price.amount === "number" && typeof price.currency_code === "string"
  )

  if (!validPrices.length) {
    return 0
  }

  const byCurrency = normalizedCurrency
    ? validPrices.filter((price) => price.currency_code.toLowerCase() === normalizedCurrency)
    : validPrices

  const basePrice =
    byCurrency.find((price) => !price.price_list_id) ||
    byCurrency[0] ||
    validPrices.find((price) => !price.price_list_id) ||
    validPrices[0]

  return Math.max(0, basePrice?.amount ?? 0)
}

export  const getVariantPriceMap = async (
  query: { graph: (input: Record<string, unknown>) => Promise<VariantPriceQueryResponse> },
  variantIds: string[],
  currencyCode?: string | null
) => {
  if (!variantIds.length) {
    return new Map<string, number>()
  }

  const result: VariantPriceQueryResponse = await query.graph({
    entity: "product_variant",
    fields: [
      "id",
      "price_set.prices.amount",
      "price_set.prices.currency_code",
      "price_set.prices.price_list_id",
    ],
    filters: {
      id: variantIds,
    },
  })

  return new Map(
    (result.data || []).map((variant) => [
      variant.id,
      pickVariantPrice(variant.price_set?.prices, currencyCode),
    ])
  )
} 