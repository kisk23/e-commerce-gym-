import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatWeight = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "—"
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} kg`
  }

  return `${value.toFixed(0)} g`
}

const getItemWeight = (item: AdminOrder["items"][number]) => {
  const metadata = (item.metadata || {}) as Record<string, unknown>
  const weight =
    metadata.weight_g ??
    metadata.bundle_item_weight ??
    metadata.bundle_item_weight_g ??
    metadata.weight

  return Math.max(0, toNumber(weight))
}

const OrderShippingWeightWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const items = data?.items || []
  const rows = items.map((item) => {
    const unitWeight = getItemWeight(item)
    const quantity = Math.max(0, Number(item.quantity) || 0)
    const totalWeight = unitWeight * quantity

    return {
      id: item.id,
      title: item.title || item.product_title || "Item",
      variant: item.variant_title || "",
      quantity,
      unitWeight,
      totalWeight,
    }
  })

  const totalWeight = rows.reduce((sum, row) => sum + row.totalWeight, 0)

  return (
    <div className="rounded-lg border border-ui-border-base p-4 bg-ui-bg-base">
      <h2 className="text-lg font-semibold">Shipping Weights</h2>
      <p className="text-ui-fg-subtle text-sm">
        Shows per-item weight from line item metadata.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {rows.length ? (
          rows.map((row) => (
            <div
              key={row.id}
              className="rounded-md border border-ui-border-base px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">
                  {row.title}
                  {row.variant ? ` · ${row.variant}` : ""}
                </div>
                <div className="text-ui-fg-subtle">
                  Qty: {row.quantity}
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-ui-fg-subtle">
                <span>Unit: {formatWeight(row.unitWeight)}</span>
                <span>Total: {formatWeight(row.totalWeight)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-ui-fg-subtle text-sm">No items found.</div>
        )}
      </div>
      <div className="mt-3 flex justify-between text-sm font-medium">
        <span>Total order weight</span>
        <span>{formatWeight(totalWeight)}</span>
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderShippingWeightWidget
