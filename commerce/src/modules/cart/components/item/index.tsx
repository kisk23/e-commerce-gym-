"use client"

import { Table, Text, clx } from "@medusajs/ui"
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
import { useState } from "react"

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

const Item = ({
  item,
  groupedItems,
  type = "full",
  currencyCode,
}: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sourceItems = groupedItems && groupedItems.length ? groupedItems : [item]
  const quantityUnits = Math.max(
    1,
    sourceItems.reduce(
      (sum, lineItem) => sum + Math.max(0, Number(lineItem.quantity || 0)),
      0
    )
  )
  const quantityKg = quantityUnits / 10

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
  }))

  const totalCalories = sourceItems.reduce((sum, lineItem, index) => {
    const nutritionPer100g =
      ((lineItem.variant?.product?.metadata as Record<string, unknown> | undefined)
        ?.nutrition_per_100g as Record<string, unknown> | undefined) || undefined

    if (
      !nutritionPer100g ||
      nutritionPer100g.calories === null ||
      nutritionPer100g.calories === undefined
    ) {
      return sum
    }

    return sum + (toNumber(nutritionPer100g.calories) * selectedWeightByLine[index]) / 100
  }, 0)

  const hasCalories = totalCalories > 0
  const totalAmount = sourceItems.reduce(
    (sum, lineItem) => sum + Number(lineItem.total ?? 0),
    0
  )
  const bundleLineEntries = Array.from(
    sourceItems.reduce((map, lineItem) => {
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

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const incrementBy100g = () => {
    void changeQuantity(Math.max(1, Number(item.quantity || 0) + 1))
  }

  const decrementBy100g = () => {
    const current = Math.max(1, Number(item.quantity || 0))
    if (current <= 1) {
      return
    }
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
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const decrementBundleByStep = async () => {
    setError(null)
    setUpdating(true)

    await Promise.all(bundleLineEntries.map(async ({ lineItem, stepUnits }) => {
      const currentQuantity = Math.max(1, Number(lineItem.quantity || 0))
      if (currentQuantity <= stepUnits) {
        await deleteLineItem(lineItem.id)
        return
      }

      await updateLineItem({
        lineId: lineItem.id,
        quantity: currentQuantity - stepUnits,
      })
    }))
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const removeLineItem = async () => {
    setRemoving(true)
    await Promise.all(sourceItems.map((lineItem) => deleteLineItem(lineItem.id))).finally(
      () => setRemoving(false)
    )
  }

  if (type === "full" && hasBundleMetadata) {
    return (
      <Table.Row className="w-full" data-testid="product-row">
        <Table.Cell className="!pl-0 !pr-0 py-4" colSpan={5}>
          <div className="rounded-[20px] border border-[#E6E6E6] p-6 flex gap-4 items-start">
            <LocalizedClientLink
              href={`/products/${item.product_handle}`}
              className="w-24 h-24 rounded-xl overflow-hidden shrink-0"
            >
              <Thumbnail
                thumbnail={item.thumbnail}
                images={item.variant?.product?.images}
                size="square"
              />
            </LocalizedClientLink>

            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-start justify-between border-b border-[#E6E6E6] pb-6">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs leading-4 text-[#717182]">{bundleLabel}</p>
                    <h3 className="text-[18px] leading-7 font-semibold text-[#0A0A0A]">
                      {bundleTitle}
                    </h3>
                    <p className="text-sm leading-5 text-[#717182]">
                      {includes.length} product{includes.length > 1 ? "s" : ""}
                      {hasCalories ? ` - ${Math.round(totalCalories)} cal` : ""}
                    </p>
                  </div>
                  <div className="text-xs leading-4 text-[#717182]">
                    {includes.slice(0, 4).map((entry) => (
                      <p key={entry.id}>- {entry.title} ({entry.weightG}g)</p>
                    ))}
                    {includes.length > 4 ? <p>- +{includes.length - 4} more</p> : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeLineItem}
                  disabled={removing}
                  className="p-2 rounded-xl text-[#830010] hover:bg-[#FFF1F3] disabled:opacity-50"
                  data-testid="product-delete-button"
                >
                  {removing ? <Spinner className="animate-spin" /> : <Trash />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void decrementBundleByStep()}
                    disabled={updating || removing}
                    className="w-8 h-8 rounded-[10px] border border-[#E6E6E6] flex items-center justify-center text-base leading-none disabled:opacity-50"
                    data-testid="product-decrement-100g"
                  >
                    -
                  </button>
                  <span className="min-w-8 text-center text-base font-medium text-[#0A0A0A]">
                    {Number.isInteger(quantityKg) ? quantityKg : quantityKg.toFixed(1)}
                  </span>
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
                  <p className="text-sm leading-5 text-[#717182]">Item total</p>
                  <p className="text-[28px] leading-7 font-semibold text-[rgb(var(--primary))]">
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
        </Table.Cell>
      </Table.Row>
    )
  }

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <Text
          className="txt-medium-plus text-ui-fg-base"
          data-testid="product-title"
        >
          {item.product_title}
        </Text>
        <LineItemOptions variant={item.variant} data-testid="product-variant" />
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <div className="flex flex-col gap-2 items-start min-w-[170px]">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decrementBy100g}
                disabled={updating || Math.max(1, Number(item.quantity || 0)) <= 1}
                className="px-2 py-1 text-xs border border-ui-border-base rounded-md hover:bg-ui-bg-subtle disabled:opacity-50"
                data-testid="product-decrement-100g"
              >
                -100g
              </button>
              <span className="text-sm text-ui-fg-subtle min-w-[52px] text-center">
                {Number.isInteger(Math.max(1, Number(item.quantity || 0)) / 10)
                  ? Math.max(1, Number(item.quantity || 0)) / 10
                  : (Math.max(1, Number(item.quantity || 0)) / 10).toFixed(1)} kg
              </span>
              <button
                type="button"
                onClick={incrementBy100g}
                disabled={updating}
                className="px-2 py-1 text-xs border border-ui-border-base rounded-md hover:bg-ui-bg-subtle disabled:opacity-50"
                data-testid="product-increment-100g"
              >
                +100g
              </button>
              {updating ? <Spinner /> : null}
            </div>
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <Text className="text-ui-fg-muted">
                {Number.isInteger(Math.max(1, Number(item.quantity || 0)) / 10)
                  ? Math.max(1, Number(item.quantity || 0)) / 10
                  : (Math.max(1, Number(item.quantity || 0)) / 10).toFixed(1)} kg
              </Text>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
