"use client"

import { addBundleToCart } from "@lib/data/bundles"
import { StoreBundle } from "@lib/types/bundle"
import { Button } from "@medusajs/ui"
import { useState } from "react"

type BundleCatalogProps = {
  bundles: StoreBundle[]
  countryCode: string
}

const BundleCatalog = ({ bundles, countryCode }: BundleCatalogProps) => {
  const [isAddingId, setIsAddingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const onAddBundle = async (bundleId: string) => {
    setIsAddingId(bundleId)
    setMessage(null)

    try {
      await addBundleToCart({
        bundleId,
        countryCode,
      })
      setMessage("Bundle added to cart.")
    } catch {
      setMessage("Could not add bundle to cart.")
    } finally {
      setIsAddingId(null)
    }
  }

  if (!bundles.length) {
    return (
      <section className="content-container py-8">
        <h2 className="text-2xl-semi mb-2">Product Bundles</h2>
        <p className="text-ui-fg-subtle">No bundles are available yet.</p>
      </section>
    )
  }

  return (
    <section className="content-container py-8 flex flex-col gap-4">
      <h2 className="text-2xl-semi">Product Bundles</h2>
      <p className="text-ui-fg-subtle">
        Order full bundles and get the discount automatically in cart.
      </p>
      <div className="grid grid-cols-1 medium:grid-cols-2 gap-4">
        {bundles.map((bundle) => (
          <article
            key={bundle.id}
            className="rounded-lg border border-ui-border-base p-4 bg-white flex flex-col gap-3"
          >
            <div>
              <h3 className="text-large-semi">{bundle.title}</h3>
              {bundle.description ? (
                <p className="text-ui-fg-subtle text-sm mt-1">{bundle.description}</p>
              ) : null}
              <p className="text-ui-fg-subtle text-sm mt-1">
                Discount: {bundle.discount_percentage}% - {bundle.items.length} items
              </p>
            </div>
            <ul className="text-sm text-ui-fg-subtle">
              {bundle.items.map((item) => (
                <li key={item.id}>
                  {item.product_title} / {item.variant_title} x {item.quantity}
                </li>
              ))}
            </ul>
            <Button
              variant="primary"
              isLoading={isAddingId === bundle.id}
              disabled={isAddingId !== null}
              onClick={() => onAddBundle(bundle.id)}
            >
              Add Bundle to Cart
            </Button>
          </article>
        ))}
      </div>
      {message ? <p className="text-ui-fg-subtle">{message}</p> : null}
    </section>
  )
}

export default BundleCatalog
