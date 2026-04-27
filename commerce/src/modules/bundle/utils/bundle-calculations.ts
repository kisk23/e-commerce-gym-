import { StoreBundle } from "@lib/types/bundle"
import { HttpTypes } from "@medusajs/types"

export type BundleSelectionItem = {
  key: string
  product: HttpTypes.StoreProduct
  variantId: string
  quantity: number
}

export type NutritionPer100g = {
  calories: number
  carbs: number
  fat: number
  protein: number
}

export type ProductTotals = NutritionPer100g & {
  price: number
}

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

const getNutritionMetadata = (product: HttpTypes.StoreProduct) =>
  product.metadata as
    | {
        nutrition_per_100g?: {
          calories?: number | string | null
          carbs?: number | string | null
          fat?: number | string | null
          protein?: number | string | null
        }
      }
    | null
    | undefined

export const getVariantById = (
  product: HttpTypes.StoreProduct,
  variantId?: string
) =>
  (product.variants || []).find((variant) => variant.id === variantId) || null

export const getDefaultVariant = (product: HttpTypes.StoreProduct) => {
  const variants = product.variants || []

  return (
    variants.find(
      (variant) =>
        toNumber(variant?.calculated_price?.calculated_amount) > 0
    ) ||
    variants[0] ||
    null
  )
}

export const getProductNutritionPer100g = (
  product: HttpTypes.StoreProduct
): NutritionPer100g => {
  const metadata = getNutritionMetadata(product)

  return {
    calories: toNumber(metadata?.nutrition_per_100g?.calories),
    carbs: toNumber(metadata?.nutrition_per_100g?.carbs),
    fat: toNumber(metadata?.nutrition_per_100g?.fat),
    protein: toNumber(metadata?.nutrition_per_100g?.protein),
  }
}

export const getProductCaloriesPer100g = (product: HttpTypes.StoreProduct) => {
  return getProductNutritionPer100g(product).calories
}

export const getUnitPriceForVariant = (
  product: HttpTypes.StoreProduct,
  variantId?: string
) => {
  const variant = getVariantById(product, variantId) || getDefaultVariant(product)
  return toNumber(variant?.calculated_price?.calculated_amount)
}

export const getCurrencyCodeForVariant = (
  product: HttpTypes.StoreProduct,
  variantId?: string
) => {
  const variant = getVariantById(product, variantId) || getDefaultVariant(product)
  return (variant?.calculated_price?.currency_code || "aed").toLowerCase()
}

export const calculateProductTotals = ({
  product,
  quantity,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  quantity: number
  variantId?: string
}): ProductTotals => {
  const safeQuantity = Math.max(0, toNumber(quantity))
  const nutritionPer100g = getProductNutritionPer100g(product)
  const unitPrice = getUnitPriceForVariant(product, variantId)

  return {
    calories: (nutritionPer100g.calories * safeQuantity) / 100,
    carbs: (nutritionPer100g.carbs * safeQuantity) / 100,
    fat: (nutritionPer100g.fat * safeQuantity) / 100,
    protein: (nutritionPer100g.protein * safeQuantity) / 100,
    price: (unitPrice * safeQuantity) / 100,
  }
}

export const calculateBundleTotals = (
  items: BundleSelectionItem[]
): ProductTotals => {
  return items.reduce(
    (accumulator, item) => {
      const totals = calculateProductTotals({
        product: item.product,
        quantity: item.quantity,
        variantId: item.variantId,
      })

      return {
        calories: accumulator.calories + totals.calories,
        carbs: accumulator.carbs + totals.carbs,
        fat: accumulator.fat + totals.fat,
        protein: accumulator.protein + totals.protein,
        price: accumulator.price + totals.price,
      }
    },
    { calories: 0, carbs: 0, fat: 0, protein: 0, price: 0 }
  )
}

export const calculateBundleOriginalPrice = (bundle: StoreBundle) => {
  if (
    typeof bundle.total_price !== "number" ||
    bundle.discount_percentage === 0
  ) {
    return bundle.total_price || 0
  }

  const discountMultiplier = 1 - bundle.discount_percentage / 100
  return bundle.total_price / discountMultiplier
}

export const calculateBundleSavings = (bundle: StoreBundle) => {
  const originalPrice = calculateBundleOriginalPrice(bundle)
  const discountedPrice = bundle.total_price || 0
  return originalPrice - discountedPrice
}
