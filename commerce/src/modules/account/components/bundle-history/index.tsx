import { HttpTypes } from "@medusajs/types"
import { getOrderBundleHistory } from "@lib/util/bundle-history"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type BundleHistoryProps = {
  orders: HttpTypes.StoreOrder[]
}

const BundleHistory = ({ orders }: BundleHistoryProps) => {
  const entries = orders.flatMap((order) =>
    getOrderBundleHistory(order).map((bundle) => ({
      orderId: order.id,
      orderDisplayId: order.display_id,
      createdAt: order.created_at,
      bundle,
    }))
  )

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
        </article>
      ))}
    </div>
  )
}

export default BundleHistory
