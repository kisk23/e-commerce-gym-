"use client"

import { convertToLocale } from "@lib/util/money"
import { Button } from "@medusajs/ui"
import {
  calculateBundleTotals,
  calculateProductTotals,
  getCurrencyCodeForVariant,
  getVariantById,
} from "@modules/bundle/utils/bundle-calculations"
import { useBundleContext } from "@modules/bundle/store/bundle-context"

type BundleSummaryProps = {
  title: string
  onTitleChange: (_value: string) => void
  onSubmit: () => void
  isSubmitting: boolean
  message: string | null
}

const WEIGHT_STEP_G = 100
const MIN_ITEM_WEIGHT_G = 1000

export default function BundleSummary({
  title,
  onTitleChange,
  onSubmit,
  isSubmitting,
  message,
}: BundleSummaryProps) {
  const { items, updateQuantity, removeItem, clearItems } = useBundleContext()

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totals = calculateBundleTotals(items)
  const currencyCode =
    items[0] && items[0].variantId
      ? getCurrencyCodeForVariant(items[0].product, items[0].variantId)
      : "aed"

  return (
    <aside className="rounded-lg border border-ui-border-base p-4 md:sticky md:top-24 bg-white h-fit">
      <h2 className="text-large-semi">Bundle Summary</h2>
      <p className="text-ui-fg-subtle text-sm mt-1">
        {items.length} selections • {totalItems}g total weight
      </p>

      <div className="mt-4">
        <label className="text-sm text-ui-fg-subtle">Bundle Title</label>
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className="mt-1 w-full rounded-md border border-ui-border-base px-3 py-2"
          placeholder="My Custom Bundle"
        />
      </div>

      {!items.length ? (
        <p className="mt-4 rounded-md bg-ui-bg-subtle p-3 text-sm text-ui-fg-subtle">
          Add products from the list to build your custom bundle.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const variant = getVariantById(item.product, item.variantId)
            const itemTotals = calculateProductTotals({
              product: item.product,
              quantity: item.quantity,
              variantId: item.variantId,
            })

            return (
              <li
                key={item.key}
                className="rounded-md border border-ui-border-base p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ui-fg-base">
                      {item.product.title}
                    </p>
                    <p className="text-xs text-ui-fg-subtle mt-1">
                      {variant?.title || "Default"}
                    </p>
                    <p className="text-xs text-ui-fg-subtle mt-1">
                      {Math.round(itemTotals.calories)} cal
                    </p>
                    <p className="text-xs text-ui-fg-subtle mt-1">
                      C {Math.round(itemTotals.carbs)}g • F{" "}
                      {Math.round(itemTotals.fat)}g • P{" "}
                      {Math.round(itemTotals.protein)}g
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-ui-fg-base">
                      {convertToLocale({
                        amount: itemTotals.price,
                        currency_code: getCurrencyCodeForVariant(
                          item.product,
                          item.variantId
                        ),
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="text-xs text-ui-fg-subtle hover:text-ui-fg-base"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <label className="text-xs text-ui-fg-subtle">Amount (g)</label>
                  <input
                    type="number"
                    min={MIN_ITEM_WEIGHT_G}
                    step={WEIGHT_STEP_G}
                    value={item.quantity}
                    onChange={(event) =>
                      updateQuantity(item.key, Number(event.target.value))
                    }
                    className="mt-1 w-full rounded-md border border-ui-border-base px-2 py-1 text-sm"
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-4 rounded-md bg-ui-bg-subtle p-3">
        <div className="flex justify-between text-sm text-ui-fg-subtle">
          <span>Total Calories</span>
          <span>{Math.round(totals.calories)} cal</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-ui-fg-subtle">
          <div className="rounded bg-white px-2 py-1 text-center">
            Carbs: {Math.round(totals.carbs)}g
          </div>
          <div className="rounded bg-white px-2 py-1 text-center">
            Fat: {Math.round(totals.fat)}g
          </div>
          <div className="rounded bg-white px-2 py-1 text-center">
            Protein: {Math.round(totals.protein)}g
          </div>
        </div>
        <div className="mt-2 flex justify-between text-base font-semibold text-ui-fg-base">
          <span>Total Price</span>
          <span>
            {convertToLocale({
              amount: totals.price,
              currency_code: currencyCode,
            })}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          onClick={onSubmit}
          isLoading={isSubmitting}
          disabled={isSubmitting || !items.length}
        >
          Add Custom Bundle to Cart
        </Button>
        <Button
          variant="secondary"
          onClick={clearItems}
          disabled={!items.length || isSubmitting}
        >
          Clear Bundle
        </Button>
      </div>

      {message ? (
        <p className="mt-3 text-sm text-ui-fg-subtle" role="status">
          {message}
        </p>
      ) : null}
    </aside>
  )
}
