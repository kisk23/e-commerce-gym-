"use client"

import { addBundleToCart } from "@lib/data/bundles"
import { StoreBundle } from "@lib/types/bundle"
import { Button } from "@medusajs/ui"
import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import {
  calculateBundleDiscountedPrice,
  calculateBundleOriginalPrice,
  calculateBundleSavings,
} from "@modules/bundle/utils/bundle-calculations"

type BundleCatalogProps = {
  bundles: StoreBundle[]
  countryCode: string
  currencyCode?: string
}

const BundleCatalog = ({
  bundles,
  countryCode,
  currencyCode,
}: BundleCatalogProps) => {
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
      <div>
        <h2 className="text-2xl-semi">Product Bundles</h2>
        <p className="text-ui-fg-subtle mt-1">
          Order full bundles and get the discount automatically in cart.
        </p>
      </div>

      <div>
        <LocalizedClientLink
          href="/bundles/custom"
          className="inline-flex items-center justify-center rounded-md border border-ui-border-base px-4 py-2 text-ui-fg-base hover:bg-ui-bg-subtle transition-colors"
        >
          Build Your Own Bundle
        </LocalizedClientLink>
      </div>

      <div className="grid grid-cols-1 medium:grid-cols-2 large:grid-cols-3 gap-6">
        {bundles.map((bundle) => {
          const originalPrice = calculateBundleOriginalPrice(bundle)
          const discountedPrice = calculateBundleDiscountedPrice(bundle)
          const savings = calculateBundleSavings(bundle)
          const hasDiscount = bundle.discount_percentage > 0

          return (
            <article
              key={bundle.id}
              className="rounded-lg border border-ui-border-base bg-white flex flex-col shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header Section */}
              <div className="p-4 border-b border-ui-border-base">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-ui-fg-base flex-1">
                    {bundle.title}
                  </h3>
                  {hasDiscount && (
                    <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 whitespace-nowrap">
                      {bundle.discount_percentage}% OFF
                    </span>
                  )}
                </div>

                {bundle.description && (
                  <p className="text-ui-fg-subtle text-sm leading-relaxed">
                    {bundle.description}
                  </p>
                )}

                {bundle.bundle_type && (
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-md bg-ui-bg-subtle px-2 py-1 text-xs font-medium text-ui-fg-muted capitalize">
                      {bundle.bundle_type}
                    </span>
                  </div>
                )}
              </div>

              {/* Pricing Section */}
              <div className="p-4 bg-ui-bg-subtle border-b border-ui-border-base">
                {typeof bundle.total_price === "number" ? (
                  <div className="space-y-2">
                    {hasDiscount ? (
                      <>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-ui-fg-subtle">
                            Original Price:
                          </span>
                          <span className="text-sm text-ui-fg-subtle line-through">
                            {convertToLocale({
                              amount: originalPrice,
                              currency_code:
                                bundle.currency_code || currencyCode || "aed",
                            })}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-base font-semibold text-ui-fg-base">
                            Discounted Price:
                          </span>
                          <span className="text-2xl font-bold text-green-700">
                            {convertToLocale({
                              amount: discountedPrice,
                              currency_code:
                                bundle.currency_code || currencyCode || "aed",
                            })}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between pt-2 border-t border-ui-border-base">
                          <span className="text-sm font-medium text-green-700">
                            You Save:
                          </span>
                          <span className="text-sm font-semibold text-green-700">
                            {convertToLocale({
                              amount: savings,
                              currency_code:
                                bundle.currency_code || currencyCode || "aed",
                            })}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-baseline justify-between">
                        <span className="text-base font-semibold text-ui-fg-base">
                          Price:
                        </span>
                        <span className="text-2xl font-bold text-ui-fg-base">
                          {convertToLocale({
                            amount: discountedPrice,
                            currency_code:
                              bundle.currency_code || currencyCode || "aed",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-ui-fg-subtle">
                    Price not available
                  </p>
                )}
              </div>

              {/* Nutrition & Weight Section */}
              <div className="p-4 border-b border-ui-border-base">
                <h4 className="text-sm font-semibold text-ui-fg-base mb-3">
                  Nutrition Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {typeof bundle.total_weight === "number" && (
                    <div className="flex flex-col">
                      <span className="text-xs text-ui-fg-subtle">
                        Total Weight
                      </span>
                      <span className="text-sm font-semibold text-ui-fg-base">
                        {bundle.total_weight}g
                      </span>
                    </div>
                  )}
                  {typeof bundle.total_calories === "number" && (
                    <div className="flex flex-col">
                      <span className="text-xs text-ui-fg-subtle">
                        Calories
                      </span>
                      <span className="text-sm font-semibold text-ui-fg-base">
                        {bundle.total_calories} kcal
                      </span>
                    </div>
                  )}
                  {typeof bundle.total_protein === "number" && (
                    <div className="flex flex-col">
                      <span className="text-xs text-ui-fg-subtle">Protein</span>
                      <span className="text-sm font-semibold text-ui-fg-base">
                        {bundle.total_protein}g
                      </span>
                    </div>
                  )}
                  {typeof bundle.total_carbs === "number" && (
                    <div className="flex flex-col">
                      <span className="text-xs text-ui-fg-subtle">Carbs</span>
                      <span className="text-sm font-semibold text-ui-fg-base">
                        {bundle.total_carbs}g
                      </span>
                    </div>
                  )}
                  {typeof bundle.total_fat === "number" && (
                    <div className="flex flex-col">
                      <span className="text-xs text-ui-fg-subtle">Fat</span>
                      <span className="text-sm font-semibold text-ui-fg-base">
                        {bundle.total_fat}g
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bundle Items Section */}
              <div className="p-4 border-b border-ui-border-base flex-1">
                <h4 className="text-sm font-semibold text-ui-fg-base mb-2">
                  Bundle Contents ({bundle.items.length} items)
                </h4>
                <ul className="space-y-1">
                  {bundle.items.map((item) => (
                    <li
                      key={item.id}
                      className="text-sm text-ui-fg-subtle flex items-start gap-2"
                    >
                      <span className="text-ui-fg-muted mt-0.5">•</span>
                      <span className="flex-1">
                        <span className="font-medium text-ui-fg-base">
                          {item.product_title}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-ui-fg-muted">
                            {" "}
                            × {item.quantity}
                          </span>
                        )}
                        {typeof item.weight === "number" && item.weight > 0 && (
                          <span className="text-ui-fg-muted">
                            {" "}
                            ({item.weight}g)
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="p-4">
                <Button
                  variant="primary"
                  className="w-full"
                  isLoading={isAddingId === bundle.id}
                  disabled={isAddingId !== null}
                  onClick={() => onAddBundle(bundle.id)}
                >
                  {isAddingId === bundle.id
                    ? "Adding..."
                    : "Add Bundle to Cart"}
                </Button>
              </div>
            </article>
          )
        })}
      </div>

      {message && (
        <div
          className={`mt-4 p-4 rounded-md ${
            message.includes("added")
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}
    </section>
  )
}

export default BundleCatalog
