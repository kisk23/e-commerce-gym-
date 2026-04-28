"use client"

import { Table, Text, clx } from "@medusajs/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quantityUnits = Math.max(1, Number(item.quantity || 1))
  const quantityKg = quantityUnits / 10

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
    void changeQuantity(quantityUnits + 1)
  }

  const decrementBy100g = () => {
    if (quantityUnits <= 1) {
      return
    }
    void changeQuantity(quantityUnits - 1)
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
                disabled={updating || quantityUnits <= 1}
                className="px-2 py-1 text-xs border border-ui-border-base rounded-md hover:bg-ui-bg-subtle disabled:opacity-50"
                data-testid="product-decrement-100g"
              >
                -100g
              </button>
              <span className="text-sm text-ui-fg-subtle min-w-[52px] text-center">
                {Number.isInteger(quantityKg) ? quantityKg : quantityKg.toFixed(1)} kg
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
                {Number.isInteger(quantityKg) ? quantityKg : quantityKg.toFixed(1)} kg
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
