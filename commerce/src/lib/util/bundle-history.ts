import { HttpTypes } from "@medusajs/types"

export type OrderBundleHistory = {
  key: string
  bundle_id: string
  bundle_title: string
  discount_percentage: number
  bundle_type: "admin" | "custom"
  items: {
    id: string
    title: string
    variant_id: string | null
    quantity: number
  }[]
}

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const getOrderBundleHistory = (
  order: Pick<HttpTypes.StoreOrder, "items">
): OrderBundleHistory[] => {
  const bundleMap = new Map<string, OrderBundleHistory>()

  for (const item of order.items || []) {
    const metadata = (item.metadata || {}) as Record<string, unknown>
    const bundleId =
      typeof metadata.bundle_id === "string" ? metadata.bundle_id : ""

    if (!bundleId) {
      continue
    }

    const bundleTitle =
      (typeof metadata.bundle_title === "string" && metadata.bundle_title) ||
      "Bundle"
    const operationId =
      (typeof metadata.bundle_operation_id === "string" &&
        metadata.bundle_operation_id) ||
      ""
    const key = operationId || `${bundleId}-${item.id}`
    const discountPercentage = toNumber(metadata.bundle_discount_percentage)
    const bundleType =
      metadata.bundle_type === "custom" || bundleId.startsWith("custom_")
        ? "custom"
        : "admin"

    const existing = bundleMap.get(key)

    if (existing) {
      existing.items.push({
        id: item.id,
        title: item.title || item.product_title || "Item",
        variant_id: item.variant_id || null,
        quantity: Number(item.quantity || 0),
      })
      continue
    }

    bundleMap.set(key, {
      key,
      bundle_id: bundleId,
      bundle_title: bundleTitle,
      discount_percentage: discountPercentage,
      bundle_type: bundleType,
      items: [
        {
          id: item.id,
          title: item.title || item.product_title || "Item",
          variant_id: item.variant_id || null,
          quantity: Number(item.quantity || 0),
        },
      ],
    })
  }

  return Array.from(bundleMap.values())
}
