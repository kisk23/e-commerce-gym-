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
    <aside className="w-full xl:sticky xl:top-24 flex flex-col gap-6">
      <div className="rounded-3xl p-6 bg-[#F8F9FA] border border-[#E6E6E6]">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col">
              <p className="text-base font-semibold text-[#0A0A0A]">
                Total Calories
              </p>
              <p className="text-xs font-medium text-[#717182] mt-1">
                Recommended {RECOMMENDED_CALORIES} cal
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#1A330B]">
                {roundedCalories}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="w-full h-2.5 bg-[#E6E6E6] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1A330B] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${calorieProgressPct}%` }}
              />
            </div>
            <p className="text-xs font-medium text-center text-[#717182] mt-1">
              {remainingCalories} cal remaining
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#E6E6E6] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <h2 className="text-xl font-bold text-[#0A0A0A]">
          Your Bundle
        </h2>
        <p className="text-sm text-[#717182] mt-1 font-medium">{title}</p>

        <div className="mt-6">
          {!items.length ? (
            <div className="flex flex-col items-center justify-center py-10 bg-[#F5F5F5] rounded-2xl border border-dashed border-[#D1D1D1]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#A3A3A3] mb-3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <p className="text-sm font-medium text-[#717182] text-center max-w-[200px]">
                Add products from the list to build your custom bundle.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 pb-6 border-b border-[#E6E6E6]">
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
                      className="w-full bg-[#F8F9FA] rounded-2xl p-3 flex items-center justify-between gap-4 border border-[#E6E6E6]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Image
                          src={item.product.thumbnail || "/Logo.svg"}
                          alt={item.product.title || "Bundle item"}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 bg-white"
                        />
                        <div className="min-w-0 flex flex-col gap-1">
                          <p className="text-sm font-semibold text-[#0A0A0A] truncate">
                            {item.product.title}
                          </p>
                          <p className="text-xs font-medium text-[#717182]">
                            {item.quantity}g · {Math.round(itemTotals.calories)} cal · {convertToLocale({
                              amount: itemTotals.price,
                              currency_code: itemCurrency,
                            })}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#A3A3A3] hover:text-red-500 hover:bg-white transition-colors shrink-0"
                        aria-label={`Remove ${item.product.title}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#717182] font-medium">Total Items</span>
                    <span className="font-semibold text-[#0A0A0A]">
                      {items.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#717182] font-medium">Total Weight</span>
                    <span className="font-semibold text-[#0A0A0A]">
                      {totalWeightG}g
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-[#E6E6E6] flex items-center justify-between">
                  <span className="text-base font-bold text-[#0A0A0A]">
                    Total Price
                  </span>
                  <span className="text-xl font-bold text-[#0A0A0A]">
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
            className="w-full h-12 rounded-xl bg-[#1A330B] hover:bg-[#2A431B] text-white font-semibold text-base transition-colors flex items-center justify-center"
          >
            Add Bundle to Cart
          </Button>
          {items.length > 0 && (
            <Button
              variant="secondary"
              onClick={clearItems}
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl border border-[#E6E6E6] bg-white hover:bg-[#F5F5F5] font-semibold text-sm text-[#0A0A0A] transition-colors"
            >
              Clear Bundle
            </Button>
          )}
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
