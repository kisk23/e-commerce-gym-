"use client"

import { HttpTypes } from "@medusajs/types"
import BundleCard, { BundleCardAddPayload } from "../bundle-card"

type BundleListProps = {
  products: HttpTypes.StoreProduct[]
  onAdd?: (_payload: BundleCardAddPayload) => void
}

export default function BundleList({ products, onAdd }: BundleListProps) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-ui-border-base p-6 text-ui-fg-subtle">
        No products match the selected filters for this region.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6" data-testid="bundle-builder-list">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <li key={product.id} data-testid="bundle-builder-product">
            <BundleCard product={product} onAdd={onAdd} />
          </li>
        ))}
      </ul>
    </div>
  )
}
