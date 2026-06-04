"use client"

import { convertToLocale } from "@lib/util/money"
import { Button } from "@medusajs/ui"
import Image from "next/image"
import {
  calculateBundleTotals,
  calculateProductTotals,
  getCurrencyCodeForVariant,
} from "@modules/bundle/utils/bundle-calculations"
import { useBundleContext } from "@modules/bundle/store/bundle-context"

type BundleSummaryProps = {
  title: string
  onTitleChange: (_value: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  message: string | null
}

const RECOMMENDED_CALORIES = 2000

export default function BundleSummary({
  title,
  onTitleChange: _onTitleChange,
  onSubmit,
  isSubmitting,
  message,
}: BundleSummaryProps) {
  const { items, removeItem, clearItems } = useBundleContext()

  const totalWeightG = items.reduce((sum, item) => sum + item.quantity, 0)
  const totals = calculateBundleTotals(items)
  const roundedCalories = Math.round(totals.calories)
  const calorieProgressPct = Math.max(
    0,
    Math.min(100, (roundedCalories / RECOMMENDED_CALORIES) * 100)
  )
  const remainingCalories = Math.max(0, RECOMMENDED_CALORIES - roundedCalories)

  const currencyCode =
    items[0] && items[0].variantId
      ? getCurrencyCodeForVariant(items[0].product, items[0].variantId)
      : "aed"

  return (
    <aside className="w-full xl:sticky xl:top-24 flex flex-col gap-4">
      <div className="rounded-xl p-3 bg-[linear-gradient(135deg,rgba(223,208,189,0.4)_0%,rgba(223,208,189,0.2)_100%)]">
        <div className="flex flex-col gap-[18px]">
          <div className="flex items-center justify-between gap-9">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#D3D8CC]" />
              <div>
                <p className="text-sm leading-5 font-medium text-[#0A0A0A]">
                  Total Calories
                </p>
                <p className="text-xs leading-4 text-[#717182]">
                  Recommended: {RECOMMENDED_CALORIES} cal
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl leading-8 font-semibold text-[rgb(var(--primary))]">
                {roundedCalories}
              </p>
              <p className="text-xs leading-4 text-[#717182]">calories</p>
            </div>
          </div>

          <div className="w-full h-2 bg-[#D3D8CC] rounded-full overflow-hidden">
            <div
              className="h-full bg-[rgb(var(--primary))] rounded-full transition-all"
              style={{ width: `${calorieProgressPct}%` }}
            />
          </div>
        </div>

        <p className="mt-3 text-xs leading-4 font-medium text-center text-[#717182]">
          {remainingCalories} cal remaining
        </p>
      </div>

      <div className="rounded-xl border border-[#E6E6E6] bg-white px-5 py-6">
        <h2 className="text-[20px] leading-7 font-semibold text-[#0A0A0A]">
          Your Bundle
        </h2>
        <p className="text-xs leading-4 text-[#717182] mt-1">{title}</p>

        <div className="mt-6 px-0.5">
          {!items.length ? (
            <p className="text-sm leading-5 text-[#717182] text-center py-8">
              Add products from the list to build your custom bundle.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5 pb-6 border-b border-[#E6E6E6]">
                {items.map((item) => {
                  const itemTotals = calculateProductTotals({
                    product: item.product,
                    quantity: item.quantity,
                    variantId: item.variantId,
                  })
                  const itemCurrency = getCurrencyCodeForVariant(
                    item.product,
                    item.variantId
                  )

                  return (
                    <div
                      key={item.key}
                      className="w-full bg-[#FAF5EF] p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-[11px] min-w-0">
                        <Image
                          src={item.product.thumbnail || "/placeholder.png"}
                          alt={item.product.title || "Bundle item"}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm leading-5 font-medium text-[#0A0A0A] truncate">
                            {item.product.title}
                          </p>
                          <p className="text-xs leading-4 text-[#717182]">
                            {item.quantity}g - {Math.round(itemTotals.calories)}{" "}
                            cal -{" "}
                            {convertToLocale({
                              amount: itemTotals.price,
                              currency_code: itemCurrency,
                            })}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="w-8 h-8 rounded-xl shrink-0"
                        aria-label={`Remove ${item.product.title}`}
                      >
                        <span className="block w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col gap-[10px]">
                <div className="pb-4 border-b border-[#E6E6E6] flex flex-col gap-[10px]">
                  <div className="flex items-center justify-between text-sm leading-5">
                    <span className="text-[#717182]">Total Items</span>
                    <span className="font-medium text-[#0A0A0A]">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm leading-5">
                    <span className="text-[#717182]">Total Weight</span>
                    <span className="font-medium text-[#0A0A0A]">
                      {totalWeightG}g
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm leading-5">
                    <span className="text-[#717182]">Total Calories</span>
                    <span className="font-medium text-[#0A0A0A]">
                      {roundedCalories}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base leading-6 font-semibold text-[#0A0A0A]">
                    Total Price
                  </span>
                  <span className="text-[20px] leading-7 font-semibold text-[rgb(var(--primary))]">
                    {convertToLocale({
                      amount: totals.price,
                      currency_code: currencyCode,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={onSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting || !items.length}
            className="w-full h-10 rounded-[10px] bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-light))] text-white text-sm font-medium"
          >
            Add to Cart
          </Button>
          <Button
            variant="secondary"
            onClick={clearItems}
            disabled={!items.length || isSubmitting}
            className="w-full h-8 rounded-[10px] border border-[#E6E6E6] bg-white text-sm font-medium text-[#0A0A0A]"
          >
            Clear All
          </Button>
        </div>

        {message ? (
          <p className="mt-3 text-sm text-[#717182]" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </aside>
  )
}
