"use client"

import { Text, clx } from "@medusajs/ui"
import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { Trash } from "@medusajs/icons"
import { useEffect, useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  groupedItems?: HttpTypes.StoreCartLineItem[]
  type?: "full" | "preview"
  currencyCode: string
}

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getBundleStepUnits = (lineItem: HttpTypes.StoreCartLineItem) => {
  const metadata = (lineItem.metadata || {}) as Record<string, unknown>
  const metadataStep = toNumber(metadata.bundle_item_units, 0)

  if (metadataStep > 0) {
    return Math.max(1, Math.round(metadataStep))
  }

  const weightG = toNumber(
    metadata.selected_weight_g ??
      metadata.bundle_item_weight ??
      metadata.weight_g,
    100
  )

  return Math.max(1, Math.round(weightG / 100))
}

/**
 * Returns the sum of bundle-only adjustments for a line item.
 * Subscription adjustments (SUBSCRIPTION_PLAN_DISCOUNT) are intentionally excluded
 * so that item card totals show post-bundle-discount prices only.
 */
const getBundleAdjustmentAmount = (
  lineItem: HttpTypes.StoreCartLineItem
): number => {
  const adjustments = ((lineItem as any).adjustments || []) as Array<{
    code?: string
    amount?: unknown
  }>
  return adjustments
    .filter(
      (adj) => typeof adj.code === "string" && adj.code.startsWith("BUNDLE_")
    )
    .reduce((sum, adj) => sum + Number(adj.amount ?? 0), 0)
}

const Item = ({
  item,
  groupedItems,
  type = "full",
  currencyCode,
}: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sourceItems =
    groupedItems && groupedItems.length ? groupedItems : [item]
  const metadata = (item.metadata || {}) as Record<string, unknown>
  const bundleId =
    typeof metadata.bundle_id === "string" ? metadata.bundle_id : ""
  const hasBundleMetadata = !!bundleId
  const isCustomBundle =
    metadata.bundle_type === "custom" || bundleId.startsWith("custom_")
  const bundleLabel = isCustomBundle ? "Custom Bundle" : "Recommended Bundle"
  const bundleTitle =
    typeof metadata.bundle_title === "string" && metadata.bundle_title
      ? metadata.bundle_title
      : bundleLabel

  const selectedWeightByLine = sourceItems.map((lineItem) => {
    const lineMetadata = (lineItem.metadata || {}) as Record<string, unknown>
    return Math.max(
      100,
      toNumber(
        lineMetadata.selected_weight_g ??
          lineMetadata.bundle_item_weight ??
          lineMetadata.weight_g ??
          Number(lineItem.quantity || 1) * 100,
        Number(lineItem.quantity || 1) * 100
      )
    )
  })

  const includes = sourceItems.map((lineItem, index) => ({
    id: lineItem.id,
    title: lineItem.product_title || lineItem.title || "Item",
    weightG: selectedWeightByLine[index],
    subtotal: lineItem.subtotal,
    total: lineItem.total,
    bundleDiscountedTotal: Math.max(
      0,
      Number(lineItem.subtotal ?? 0) - getBundleAdjustmentAmount(lineItem)
    ),
  }))

  const totalCalories = sourceItems.reduce((sum, lineItem, index) => {
    const nutritionPer100g =
      ((
        lineItem.variant?.product?.metadata as
          | Record<string, unknown>
          | undefined
      )?.nutrition_per_100g as Record<string, unknown> | undefined) || undefined

    if (
      !nutritionPer100g ||
      nutritionPer100g.calories === null ||
      nutritionPer100g.calories === undefined
    ) {
      return sum
    }

    return (
      sum +
      (toNumber(nutritionPer100g.calories) * selectedWeightByLine[index]) / 100
    )
  }, 0)

  const hasCalories = totalCalories > 0
  const originalTotalAmount = sourceItems.reduce(
    (sum, lineItem) => sum + Number(lineItem.subtotal ?? 0),
    0
  )

  const bundleDiscountedTotalAmount = sourceItems.reduce(
    (sum, lineItem) =>
      sum +
      Math.max(
        0,
        Number(lineItem.subtotal ?? 0) - getBundleAdjustmentAmount(lineItem)
      ),
    0
  )

  const totalAmount = isCustomBundle
    ? originalTotalAmount
    : bundleDiscountedTotalAmount

  const hasDiscount =
    !isCustomBundle && bundleDiscountedTotalAmount < originalTotalAmount

  const bundleLineEntries = Array.from(
    sourceItems
      .reduce((map, lineItem) => {
        const key =
          lineItem.variant_id ||
          lineItem.product_id ||
          lineItem.product_title ||
          lineItem.id
        if (!map.has(key)) {
          map.set(key, {
            lineItem,
            stepUnits: getBundleStepUnits(lineItem),
          })
        }
        return map
      }, new Map<string, { lineItem: HttpTypes.StoreCartLineItem; stepUnits: number }>())
      .values()
  )

  const bundleCount = Math.max(
    1,
    Math.round(
      Math.min(
        ...bundleLineEntries.map(
          ({ lineItem, stepUnits }) =>
            Math.max(1, Number(lineItem.quantity || 0)) / Math.max(1, stepUnits)
        )
      )
    )
  )

  const [bundleInput, setBundleInput] = useState(bundleCount)

  useEffect(() => {
    setBundleInput(bundleCount)
  }, [bundleCount])

  useEffect(() => {
    if (bundleInput === bundleCount) return
    const timer = setTimeout(() => {
      void updateBundleCount(bundleInput)
    }, 1000)
    return () => clearTimeout(timer)
  }, [bundleInput, bundleCount])

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)
    await updateLineItem({ lineId: item.id, quantity })
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  const incrementBy100g = () =>
    void changeQuantity(Math.max(1, Number(item.quantity || 0) + 1))

  const decrementBy100g = () => {
    const current = Math.max(1, Number(item.quantity || 0))
    if (current <= 1) return
    void changeQuantity(current - 1)
  }

  const incrementBundleByStep = async () => {
    setError(null)
    setUpdating(true)
    await Promise.all(
      bundleLineEntries.map(({ lineItem, stepUnits }) =>
        updateLineItem({
          lineId: lineItem.id,
          quantity: Math.max(1, Number(lineItem.quantity || 0) + stepUnits),
        })
      )
    )
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  const decrementBundleByStep = async () => {
    setError(null)
    setUpdating(true)
    await Promise.all(
      bundleLineEntries.map(async ({ lineItem, stepUnits }) => {
        const currentQuantity = Math.max(1, Number(lineItem.quantity || 0))
        if (currentQuantity <= stepUnits) {
          await deleteLineItem(lineItem.id)
          return
        }
        await updateLineItem({
          lineId: lineItem.id,
          quantity: currentQuantity - stepUnits,
        })
      })
    )
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  const updateBundleCount = async (nextBundleCount: number) => {
    const safeCount = Math.max(1, Math.floor(nextBundleCount))
    setError(null)
    setUpdating(true)
    await Promise.all(
      bundleLineEntries.map(({ lineItem, stepUnits }) =>
        updateLineItem({ lineId: lineItem.id, quantity: safeCount * stepUnits })
      )
    )
      .catch((err) => setError(err.message))
      .finally(() => setUpdating(false))
  }

  const removeLineItem = async () => {
    setRemoving(true)
    await Promise.all(
      sourceItems.map((lineItem) => deleteLineItem(lineItem.id))
    ).finally(() => setRemoving(false))
  }

  /* ── Bundle item card ─────────────────────────────────────────────── */
  if (type === "full" && hasBundleMetadata) {
    return (
      <div className="w-full" data-testid="product-row">
        <div className="rounded-[20px] border border-[#E6E6E6] p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start">
          {/* Thumbnail — banner height on xs, fixed square on sm+ */}
          <div className="w-full h-36 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0">
            <Thumbnail
              thumbnail={item.thumbnail}
              images={item.variant?.product?.images}
              size="square"
            />
          </div>

          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Title row + delete */}
            <div className="flex items-start justify-between border-b border-[#E6E6E6] pb-4 gap-2">
              <div className="flex flex-col gap-2 min-w-0">
                <div>
                  <p className="text-xs leading-4 text-[#717182]">
                    {bundleLabel}
                  </p>
                  <h3 className="text-base sm:text-[18px] leading-6 sm:leading-7 font-semibold text-[#0A0A0A]">
                    {bundleTitle}
                  </h3>
                  <p className="text-sm leading-5 text-[#717182]">
                    {includes.length} product{includes.length > 1 ? "s" : ""}
                    {hasCalories ? ` · ${Math.round(totalCalories)} cal` : ""}
                  </p>
                </div>

                {/* Item breakdown */}
                <div className="text-xs leading-5 text-[#717182] space-y-0.5">
                  {includes.slice(0, 4).map((entry) => {
                    const safeBundleCount = Math.max(1, bundleCount)
                    const itemSubtotal = Number(entry.subtotal ?? 0)
                    const unitSubtotal = Math.round(
                      itemSubtotal / safeBundleCount
                    )
                    const unitBundleDiscountedTotal = Math.round(
                      entry.bundleDiscountedTotal / safeBundleCount
                    )
                    const hasBundleDiscount =
                      !isCustomBundle && unitBundleDiscountedTotal < unitSubtotal

                    return (
                      <p key={entry.id}>
                        · {entry.title} ({entry.weightG}g) (
                        {hasBundleDiscount ? (
                          <>
                            <span className="line-through">
                              {convertToLocale({
                                amount: unitSubtotal,
                                currency_code: currencyCode,
                              })}
                            </span>{" "}
                            {convertToLocale({
                              amount: unitBundleDiscountedTotal,
                              currency_code: currencyCode,
                            })}
                          </>
                        ) : (
                          convertToLocale({
                            amount: unitSubtotal,
                            currency_code: currencyCode,
                          })
                        )}
                        )
                        {bundleCount > 1 && (
                          <span className="font-medium text-[#0A0A0A]">
                            {" "}
                            ×{bundleCount}
                          </span>
                        )}
                      </p>
                    )
                  })}
                  {includes.length > 4 ? (
                    <p>· +{includes.length - 4} more</p>
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={removeLineItem}
                disabled={removing}
                className="p-2 rounded-xl text-[#830010] hover:bg-[#FFF1F3] disabled:opacity-50 shrink-0"
                data-testid="product-delete-button"
              >
                {removing ? <Spinner className="animate-spin" /> : <Trash />}
              </button>
            </div>

            {/* Quantity stepper + total — wraps gracefully on xs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void decrementBundleByStep()}
                  disabled={updating || removing}
                  className="w-8 h-8 rounded-[10px] border border-[#E6E6E6] flex items-center justify-center text-base leading-none disabled:opacity-50"
                  data-testid="product-decrement-100g"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={bundleInput}
                  onChange={(e) =>
                    setBundleInput(Math.max(1, Number(e.target.value)))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void updateBundleCount(bundleInput)
                      e.currentTarget.blur()
                    }
                  }}
                  className="w-12 h-10 text-center text-base font-medium text-[#0A0A0A] border border-[#E6E6E6] rounded-[10px] outline-none focus:border-[rgb(var(--primary))] focus:ring-1 focus:ring-[rgb(var(--primary))] disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => void incrementBundleByStep()}
                  disabled={updating || removing}
                  className="w-8 h-8 rounded-[10px] border border-[#E6E6E6] flex items-center justify-center text-base leading-none disabled:opacity-50"
                  data-testid="product-increment-100g"
                >
                  +
                </button>
                {updating ? <Spinner /> : null}
              </div>

              <div className="text-right">
                <p className="text-xs leading-4 text-[#717182]">Item total</p>
                {hasDiscount && (
                  <p className="text-sm leading-5 line-through text-[#717182]">
                    {convertToLocale({
                      amount: originalTotalAmount,
                      currency_code: currencyCode,
                    })}
                  </p>
                )}
                <p className="text-2xl sm:text-[28px] leading-7 font-semibold text-[rgb(var(--primary))]">
                  {convertToLocale({
                    amount: totalAmount,
                    currency_code: currencyCode,
                  })}
                </p>
              </div>
            </div>

            <ErrorMessage error={error} data-testid="product-error-message" />
          </div>
        </div>
      </div>
    )
  }

  /* ── Regular (non-bundle) item card ──────────────────────────────── */
  return (
    <div
      className="w-full rounded-[20px] border border-[#E6E6E6] p-4 flex gap-3 items-start"
      data-testid="product-row"
    >
      {/* Thumbnail */}
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className={clx("block shrink-0 rounded-xl overflow-hidden", {
          "w-16 h-16": type === "preview",
          "w-20 h-20 sm:w-24 sm:h-24": type === "full",
        })}
      >
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images}
          size="square"
        />
      </LocalizedClientLink>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {/* Title + delete */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Text
              className="txt-medium-plus text-ui-fg-base font-semibold leading-snug"
              data-testid="product-title"
            >
              {item.product_title}
            </Text>
            <LineItemOptions
              variant={item.variant}
              data-testid="product-variant"
            />
          </div>

          {type === "full" && (
            <div className="shrink-0">
              <DeleteButton
                id={item.id}
                data-testid="product-delete-button"
              />
            </div>
          )}
        </div>

        {/* Quantity + price for full view */}
        {type === "full" && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={decrementBy100g}
                disabled={
                  updating || Math.max(1, Number(item.quantity || 0)) <= 1
                }
                className="w-8 h-8 text-sm border border-ui-border-base rounded-lg hover:bg-ui-bg-subtle disabled:opacity-50 flex items-center justify-center"
                data-testid="product-decrement-100g"
              >
                −
              </button>
              <span className="text-sm text-ui-fg-subtle min-w-[48px] text-center">
                {Number.isInteger(
                  Math.max(1, Number(item.quantity || 0)) / 10
                )
                  ? Math.max(1, Number(item.quantity || 0)) / 10
                  : (Math.max(1, Number(item.quantity || 0)) / 10).toFixed(
                      1
                    )}{" "}
                kg
              </span>
              <button
                type="button"
                onClick={incrementBy100g}
                disabled={updating}
                className="w-8 h-8 text-sm border border-ui-border-base rounded-lg hover:bg-ui-bg-subtle disabled:opacity-50 flex items-center justify-center"
                data-testid="product-increment-100g"
              >
                +
              </button>
              {updating ? <Spinner /> : null}
            </div>

            <div className="text-right">
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
              <LineItemPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </div>
          </div>
        )}

        {/* Preview view */}
        {type === "preview" && (
          <div className="flex flex-col items-end">
            <span className="flex gap-x-1">
              <Text className="text-ui-fg-muted">
                {Number.isInteger(
                  Math.max(1, Number(item.quantity || 0)) / 10
                )
                  ? Math.max(1, Number(item.quantity || 0)) / 10
                  : (Math.max(1, Number(item.quantity || 0)) / 10).toFixed(
                      1
                    )}{" "}
                kg
              </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
            <LineItemPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </div>
        )}

        <ErrorMessage error={error} data-testid="product-error-message" />
      </div>
    </div>
  )
}

export default Item
