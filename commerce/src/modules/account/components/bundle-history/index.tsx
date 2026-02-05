"use client"

import { addBundleToCart, addCustomBundleToCart } from "@lib/data/bundles"
import { getOrderBundleHistory } from "@lib/util/bundle-history"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState } from "react"

type BundleHistoryProps = {
  orders: HttpTypes.StoreOrder[]
  countryCode: string
}

const BundleHistory = ({ orders, countryCode }: BundleHistoryProps) => {
  const [isSubmittingKey, setIsSubmittingKey] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const entries = orders.flatMap((order) =>
    getOrderBundleHistory(order).map((bundle) => ({
      orderId: order.id,
      orderDisplayId: order.display_id,
      createdAt: order.created_at,
      bundle,
    }))
  )

  const reorderBundle = async (bundle: (typeof entries)[number]["bundle"]) => {
    setMessage(null)
    setIsSubmittingKey(bundle.key)

    try {
      if (bundle.bundle_type === "admin") {
        await addBundleToCart({
          bundleId: bundle.bundle_id,
          countryCode,
        })
      } else {
        await addCustomBundleToCart({
          countryCode,
          title: bundle.bundle_title,
          items: bundle.items
            .filter((item) => !!item.variant_id)
            .map((item) => ({
              variant_id: item.variant_id as string,
              quantity: item.quantity,
            })),
        })
      }

      setMessage(`Added "${bundle.bundle_title}" to cart.`)
    } catch {
      setMessage(`Could not re-order "${bundle.bundle_title}".`)
    } finally {
      setIsSubmittingKey(null)
    }
  }

  if (!entries.length) {
    return (
      <div className="rounded-lg border border-ui-border-base p-4">
        <h2 className="text-large-semi mb-2">Bundle History</h2>
        <p className="text-ui-fg-subtle">No bundle orders yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-ui-border-base p-4 flex flex-col gap-3">
      <h2 className="text-large-semi">Bundle History</h2>
      {entries.map((entry) => (
        <article
          key={`${entry.orderId}-${entry.bundle.key}`}
          className="rounded-md border border-ui-border-base p-3"
        >
          <p className="text-small-regular text-ui-fg-subtle">
            Order #{entry.orderDisplayId} - {new Date(entry.createdAt).toDateString()}
          </p>
          <p className="text-base-regular mt-1">
            {entry.bundle.bundle_title} ({entry.bundle.discount_percentage}% off)
          </p>
          <ul className="text-small-regular text-ui-fg-subtle mt-1">
            {entry.bundle.items.map((item) => (
              <li key={item.id}>
                {item.title} x {item.quantity}
              </li>
            ))}
          </ul>
          <LocalizedClientLink
            href={`/account/orders/details/${entry.orderId}`}
            className="inline-block mt-2 text-small-regular text-ui-fg-base"
          >
            View order
          </LocalizedClientLink>
          <button
            type="button"
            onClick={() => reorderBundle(entry.bundle)}
            disabled={isSubmittingKey !== null}
            className="ml-4 inline-block mt-2 text-small-regular text-ui-fg-base underline disabled:opacity-50"
          >
            {isSubmittingKey === entry.bundle.key ? "Adding..." : "Order again"}
          </button>
        </article>
      ))}
      {message ? <p className="text-ui-fg-subtle">{message}</p> : null}
    </div>
  )
}

export default BundleHistory
