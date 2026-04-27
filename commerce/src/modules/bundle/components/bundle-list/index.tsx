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
        No products are available for bundle creation in this region yet.
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <li key={product.id}>
          <BundleCard product={product} onAdd={onAdd} />
        </li>
      ))}
    </ul>
  )
}
