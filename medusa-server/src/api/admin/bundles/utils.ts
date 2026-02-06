import { MedusaError } from "@medusajs/framework/utils"


type BundleItemInput = {
  product_id?: unknown
  variant_id?: unknown
  quantity?: unknown
  weight?: unknown
  nutrition_per_100g?: unknown
}

type BundleInput = {
  title?: unknown
  description?: unknown
  bundle_type?: unknown
  discount_percentage?: unknown
  is_active?: unknown
  items?: unknown
}

export type ProductWithVariants = {
  id: string
  title: string
  thumbnail: string | null
  metadata?: Record<string, unknown> | null
  variants?: (
    | {
        id: string
        title: string
        price_set?: {
          prices?: (
            | {
                amount: number
                currency_code: string
                price_list_id?: string | null
              }
            | null
          )[] | null
        } | null
      }
    | null
  )[] | null
}

type ProductVariantWithPrices =
  NonNullable<NonNullable<ProductWithVariants["variants"]>[number]>
type NutritionPer100g = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type NormalizedBundleItemInput = {
  product_id: string
  product_title: string
  variant_id: string
  variant_title: string
  thumbnail: string | null
  quantity: number
  weight: number
  calories: number
  protein: number
  carbs: number
  fat: number
  nutrition_per_100g: NutritionPer100g
  nutrition_source: "input" | "product"
  price_per_100g: number
}

export type NormalizedBundleInput = {
  title: string
  description: string | null
  bundle_type: string | null
  discount_percentage: number
  is_active: boolean
  items: NormalizedBundleItemInput[]
}

export type BundleTotals = {
  total_weight: number
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_price: number
}

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : NaN
  }

  return NaN
}

const sanitizeText = (value: unknown) => {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
}

const toNonNegativeNumber = (value: unknown) => {
  const parsed = toNumber(value)
  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, parsed)
}

const roundValue = (value: number) => Math.round(value * 100) / 100
const normalizeCurrencyCode = (value?: string | null) =>
  typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null

const pickVariantPrice  = (
  variant: ProductVariantWithPrices,
  currencyCode?: string | null
) => {
  const normalizedCurrency = normalizeCurrencyCode(currencyCode)
  const prices = (variant.price_set?.prices || []).filter(
    (price): price is { amount: number; currency_code: string; price_list_id?: string | null } =>
      !!price && typeof price.amount === "number" && typeof price.currency_code === "string"
  )

  if (!prices.length) {
    return 0
  }

  const byCurrency = normalizedCurrency
    ? prices.filter((price) => price.currency_code.toLowerCase() === normalizedCurrency)
    : prices

  const basePrice =
    byCurrency.find((price) => !price.price_list_id) ||
    byCurrency[0] ||
    prices.find((price) => !price.price_list_id) ||
    prices[0]

  return toNonNegativeNumber(basePrice?.amount)
}

const normalizeNutrition = (value: unknown): NutritionPer100g => {
  if (!value || typeof value !== "object") {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  }

  const payload = value as Record<string, unknown>

  return {
    calories: toNonNegativeNumber(payload.calories),
    protein: toNonNegativeNumber(payload.protein),
    carbs: toNonNegativeNumber(payload.carbs),
    fat: toNonNegativeNumber(payload.fat),
  }
}



export const normalizeBundleInput = (
  payload: BundleInput,
  products: ProductWithVariants[],
  currencyCode?: string | null
): NormalizedBundleInput => {
  const title = sanitizeText(payload.title)
  const description = sanitizeText(payload.description)
  const bundleType = sanitizeText(payload.bundle_type)
  const discountPercentage = toNumber(payload.discount_percentage)
  const items = Array.isArray(payload.items)
    ? (payload.items as BundleItemInput[])
    : []

  if (!title) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Bundle title is required")
  }

  if (!Number.isFinite(discountPercentage) || discountPercentage <= 0 || discountPercentage >= 100) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Discount percentage must be a number between 0 and 100"
    )
  }

  if (!items.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Bundle must include at least one product"
    )
  }

  const productMap = new Map(products.map((product) => [product.id, product]))

  const normalizedItems = items.map((item) => {
    const productId = sanitizeText(item.product_id)
    const variantId = sanitizeText(item.variant_id)
    const quantity = Math.max(1, Math.round(toNumber(item.quantity) || 1))
    const weight = toNonNegativeNumber(item.weight)

    if (!productId || !variantId) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Each bundle item must include product_id and variant_id"
      )
    }

    const product = productMap.get(productId)

    if (!product) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Product ${productId} wasn't found`
      )
    }

    const variants = (product.variants || []).filter(
      (entry): entry is ProductVariantWithPrices => !!entry
    )
    const variant = variants.find((entry) => entry.id === variantId)

    if (!variant) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Variant ${variantId} wasn't found in product ${product.title}`
      )
    }

    const productNutrition = normalizeNutrition(
      (product.metadata as Record<string, unknown> | null | undefined)?.nutrition_per_100g
    )
    const hasInputNutrition =
      !!item.nutrition_per_100g && typeof item.nutrition_per_100g === "object"
    const inputNutrition = hasInputNutrition
      ? normalizeNutrition(item.nutrition_per_100g)
      : productNutrition
    const nutritionSource: "input" | "product" = hasInputNutrition
      ? "input"
      : "product"
    const factor = weight / 100
    const pricePer100g = roundValue(pickVariantPrice(variant, currencyCode))

    return {
      product_id: product.id,
      product_title: product.title,
      variant_id: variant.id,
      variant_title: variant.title,
      thumbnail: product.thumbnail || null,
      quantity,
      weight,
      calories: roundValue(inputNutrition.calories * factor),
      protein: roundValue(inputNutrition.protein * factor),
      carbs: roundValue(inputNutrition.carbs * factor),
      fat: roundValue(inputNutrition.fat * factor),
      nutrition_per_100g: inputNutrition,
      nutrition_source: nutritionSource,
      price_per_100g: pricePer100g,
    }
  })

  return {
    title,
    description: description || null,
    bundle_type: bundleType || null,
    discount_percentage: discountPercentage,
    is_active: payload.is_active !== false,
    items: normalizedItems,
  }
}

export const calculateBundleTotals = (
  items: NormalizedBundleItemInput[]
): BundleTotals => {
  const totals = items.reduce(
    (acc, item) => {
      acc.total_weight += item.weight * item.quantity
      acc.total_calories += item.calories * item.quantity
      acc.total_protein += item.protein * item.quantity
      acc.total_carbs += item.carbs * item.quantity
      acc.total_fat += item.fat * item.quantity
      acc.total_price += (item.price_per_100g * item.weight * item.quantity) / 100
      return acc
    },
    {
      total_weight: 0,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      total_price: 0,
    }
  )

  return {
    total_weight: roundValue(totals.total_weight),
    total_calories: roundValue(totals.total_calories),
    total_protein: roundValue(totals.total_protein),
    total_carbs: roundValue(totals.total_carbs),
    total_fat: roundValue(totals.total_fat),
    total_price: roundValue(totals.total_price),
  }
}
