import { HttpTypes } from "@medusajs/types"
import Divider from "@modules/common/components/divider"
import { getOrderBundleHistory } from "@lib/util/bundle-history"

type BundleSummaryProps = {
  order: HttpTypes.StoreOrder
}

const BundleSummary = ({ order }: BundleSummaryProps) => {
  const bundles = getOrderBundleHistory(order)

  if (!bundles.length) {
    return null
  }

  return (
    <div>
      <Divider className="!mb-0" />
      <div className="p-4 md:p-8">
        <h2 className="text-large-semi mb-2">Bundle Summary</h2>
        <div className="flex flex-col gap-3">
          {bundles.map((bundle) => (
            <article
              key={bundle.key}
              className="rounded-md border border-ui-border-base p-3"
            >
              <p className="text-base-regular">
                {bundle.bundle_title} ({bundle.discount_percentage}% off)
              </p>
              <ul className="text-small-regular text-ui-fg-subtle mt-1">
                {bundle.items.map((item) => (
                  <li key={item.id}>
                    {item.title} x {item.quantity}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BundleSummary
