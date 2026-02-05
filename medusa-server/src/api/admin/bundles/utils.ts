import { MedusaError } from "@medusajs/framework/utils"

type BundleItemInput = {
  product_id?: unknown
  variant_id?: unknown
  quantity?: unknown
}

type BundleInput = {
  title?: unknown
  description?: unknown
  discount_percentage?: unknown
  is_active?: unknown
  items?: unknown
}

type ProductWithVariants = {
  id: string
  title: string
  thumbnail: string | null
  variants?: {
    id: string
    title: string
  }[]
}

export type NormalizedBundleItemInput = {
  product_id: string
  product_title: string
  variant_id: string
  variant_title: string
  thumbnail: string | null
  quantity: number
}

export type NormalizedBundleInput = {
  title: string
  description: string | null
  discount_percentage: number
  is_active: boolean
  items: NormalizedBundleItemInput[]
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

export const normalizeBundleInput = (
  payload: BundleInput,
  products: ProductWithVariants[]
): NormalizedBundleInput => {
  const title = sanitizeText(payload.title)
  const description = sanitizeText(payload.description)
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

    const variant = (product.variants || []).find((entry) => entry.id === variantId)

    if (!variant) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Variant ${variantId} wasn't found in product ${product.title}`
      )
    }

    return {
      product_id: product.id,
      product_title: product.title,
      variant_id: variant.id,
      variant_title: variant.title,
      thumbnail: product.thumbnail || null,
      quantity,
    }
  })

  return {
    title,
    description: description || null,
    discount_percentage: discountPercentage,
    is_active: payload.is_active !== false,
    items: normalizedItems,
  }
}
