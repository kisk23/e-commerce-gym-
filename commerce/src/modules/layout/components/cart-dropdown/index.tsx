"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { ShoppingCart, Spinner, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"

type GroupedCartItem = {
  key: string
  item: HttpTypes.StoreCartLineItem
  lineItems: HttpTypes.StoreCartLineItem[]
  itemIds: string[]
  totalQuantity: number
  /** Sum of all line item subtotals (original price, no discounts). */
  originalTotal: number
  /** Sum of subtotals minus bundle-only adjustments. Subscription discount excluded. */
  bundleDiscountedTotal: number
  isBundle: boolean
  isCustomBundle: boolean
}

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getLineMetadata = (item: HttpTypes.StoreCartLineItem) =>
  (item.metadata || {}) as Record<string, unknown>

const getBundleId = (item: HttpTypes.StoreCartLineItem) => {
  const metadata = getLineMetadata(item)
  return typeof metadata.bundle_id === "string" ? metadata.bundle_id : ""
}

const isCustomBundleLine = (item: HttpTypes.StoreCartLineItem) => {
  const metadata = getLineMetadata(item)
  const bundleId = getBundleId(item)
  return metadata.bundle_type === "custom" || bundleId.startsWith("custom_")
}

const getBundleStepUnits = (item: HttpTypes.StoreCartLineItem) => {
  const metadata = getLineMetadata(item)
  const metadataStep = toNumber(metadata.bundle_item_units)

  if (metadataStep > 0) {
    return Math.max(1, Math.round(metadataStep))
  }

  return 1
}

/**
 * Returns the sum of bundle-only adjustments for a line item.
 * Subscription adjustments (SUBSCRIPTION_PLAN_DISCOUNT) are intentionally excluded
 * so that item prices in the dropdown reflect post-bundle-discount only.
 */
const getBundleAdjustmentAmount = (
  item: HttpTypes.StoreCartLineItem
): number => {
  const adjustments = ((item as any).adjustments || []) as Array<{
    code?: string
    amount?: unknown
  }>
  return adjustments
    .filter(
      (adj) => typeof adj.code === "string" && adj.code.startsWith("BUNDLE_")
    )
    .reduce((sum, adj) => sum + Number(adj.amount ?? 0), 0)
}

const getBundleTitle = (item: HttpTypes.StoreCartLineItem) => {
  const metadata = getLineMetadata(item)

  if (
    typeof metadata.bundle_title === "string" &&
    metadata.bundle_title.trim()
  ) {
    return metadata.bundle_title.trim()
  }

  return isCustomBundleLine(item) ? "Custom Bundle" : "Recommended Bundle"
}

const getLineWeightG = (item: HttpTypes.StoreCartLineItem) => {
  const metadata = getLineMetadata(item)
  const selectedWeight = toNumber(metadata.selected_weight_g)

  if (selectedWeight > 0) {
    return selectedWeight
  }

  const itemWeight = toNumber(
    metadata.bundle_item_weight_g ?? metadata.bundle_item_weight
  )
  const itemCount = Math.max(
    1,
    Math.round(toNumber(metadata.bundle_item_count, 1))
  )

  if (itemWeight > 0) {
    return itemWeight * itemCount
  }

  return Math.max(0, Number(item.quantity || 0)) * 100
}

const formatWeight = (weightG: number) => {
  if (weightG >= 1000) {
    const value = weightG / 1000
    return `${Number.isInteger(value) ? value : value.toFixed(1)} kg`
  }

  return `${Math.round(weightG)}g`
}

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const groupedItems = useMemo(() => {
    const items = [...(cartState?.items || [])].sort((a, b) =>
      (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
    )

    const grouped = new Map<string, GroupedCartItem>()

    for (const item of items) {
      const metadata = getLineMetadata(item)
      const bundleId = getBundleId(item)
      const operationId =
        typeof metadata.bundle_operation_id === "string"
          ? metadata.bundle_operation_id
          : ""
      const isBundle = !!bundleId
      const isCustomBundle = isBundle && isCustomBundleLine(item)
      const key = operationId
        ? `bundle-operation:${operationId}`
        : bundleId
        ? `bundle:${bundleId}:${item.product_id || item.variant_id || item.id}`
        : item.product_id ||
          item.product_handle ||
          item.product_title ||
          item.id

      // Original price (no discounts).
      const itemOriginalTotal = Number(item.subtotal ?? 0)
      // Bundle-discounted total: subtract only BUNDLE_ adjustments.
      // Subscription discount intentionally excluded (shown in summary only).
      const itemBundleDiscountedTotal = Math.max(
        0,
        itemOriginalTotal - getBundleAdjustmentAmount(item)
      )

      const current = grouped.get(key)

      if (current) {
        current.lineItems.push(item)
        current.itemIds.push(item.id)
        current.totalQuantity += Number(item.quantity || 0)
        current.originalTotal += itemOriginalTotal
        current.bundleDiscountedTotal += itemBundleDiscountedTotal
        current.isBundle = current.isBundle || isBundle
        current.isCustomBundle = current.isCustomBundle || isCustomBundle
        continue
      }

      grouped.set(key, {
        key,
        item,
        lineItems: [item],
        itemIds: [item.id],
        totalQuantity: Number(item.quantity || 0),
        originalTotal: itemOriginalTotal,
        bundleDiscountedTotal: itemBundleDiscountedTotal,
        isBundle,
        isCustomBundle,
      })
    }

    return Array.from(grouped.values())
  }, [cartState?.items])

  const totalItems = groupedItems.length

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 5000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // open cart dropdown when modifying the cart items, but only if we're not on the cart page
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    itemRef.current = totalItems
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, pathname])

  const removeGroupedItems = async (itemIds: string[], groupKey: string) => {
    setActiveGroupKey(groupKey)

    try {
      for (const id of itemIds) {
        await deleteLineItem(id)
      }
    } finally {
      setActiveGroupKey(null)
    }
  }

  const incrementBy100g = async (groupedItem: GroupedCartItem) => {
    if (groupedItem.isBundle) {
      return
    }

    setActiveGroupKey(groupedItem.key)

    try {
      await updateLineItem({
        lineId: groupedItem.item.id,
        quantity: Math.max(1, Number(groupedItem.item.quantity || 0) + 1),
      })
    } finally {
      setActiveGroupKey(null)
    }
  }

  const decrementBy100g = async (groupedItem: GroupedCartItem) => {
    if (groupedItem.isBundle) {
      return
    }

    setActiveGroupKey(groupedItem.key)

    try {
      const targetLineItem =
        groupedItem.lineItems.find(
          (lineItem) => Number(lineItem.quantity || 0) > 1
        ) || groupedItem.lineItems[0]

      if (!targetLineItem) {
        return
      }

      const currentQuantity = Math.max(1, Number(targetLineItem.quantity || 0))

      if (currentQuantity <= 1) {
        await deleteLineItem(targetLineItem.id)
        return
      }

      await updateLineItem({
        lineId: targetLineItem.id,
        quantity: currentQuantity - 1,
      })
    } finally {
      setActiveGroupKey(null)
    }
  }

  const incrementLineBy100g = async (lineItem: HttpTypes.StoreCartLineItem) => {
    setActiveGroupKey(lineItem.id)

    try {
      await updateLineItem({
        lineId: lineItem.id,
        quantity:
          Math.max(1, Number(lineItem.quantity || 0)) +
          getBundleStepUnits(lineItem),
      })
    } finally {
      setActiveGroupKey(null)
    }
  }

  const decrementLineBy100g = async (lineItem: HttpTypes.StoreCartLineItem) => {
    setActiveGroupKey(lineItem.id)

    try {
      const stepUnits = getBundleStepUnits(lineItem)
      const currentQuantity = Math.max(1, Number(lineItem.quantity || 0))

      if (currentQuantity <= stepUnits) {
        await deleteLineItem(lineItem.id)
        return
      }

      await updateLineItem({
        lineId: lineItem.id,
        quantity: currentQuantity - stepUnits,
      })
    } finally {
      setActiveGroupKey(null)
    }
  }

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full ">
        <PopoverButton className="h-full">
          <LocalizedClientLink
            className="relative hover:text-ui-fg-base flex items-center gap-1 outline outline-1 outline-primary/30 rounded-lg p-1 px-2"
            href="/cart"
            data-testid="nav-cart-link"
          >
            <ShoppingCart /> Cart
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1 py-0">
              {totalItems}
            </span>
          </LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-white border-x border-b border-gray-200 w-[420px] text-ui-fg-base"
            data-testid="nav-cart-dropdown"
          >
            <div className="p-4 flex items-center justify-center">
              <h3 className="text-large-semi">Cart</h3>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="overflow-y-scroll max-h-[402px] px-4 grid grid-cols-1 gap-y-8 no-scrollbar p-px">
                  {groupedItems.map((groupedItem) => {
                    const item = groupedItem.item
                    const quantityKg = groupedItem.totalQuantity / 10
                    const isUpdating =
                      activeGroupKey === groupedItem.key ||
                      groupedItem.lineItems.some(
                        (lineItem) => lineItem.id === activeGroupKey
                      )
                    // For recommended bundles: show bundle-discounted price, strike original.
                    // For custom bundles: show original price (no bundle discount ever applied).
                    const displayTotal = groupedItem.isCustomBundle
                      ? groupedItem.originalTotal
                      : groupedItem.bundleDiscountedTotal
                    const hasReducedPrice =
                      !groupedItem.isCustomBundle &&
                      groupedItem.bundleDiscountedTotal <
                        groupedItem.originalTotal
                    const canChangeQuantity = !groupedItem.isBundle
                    const bundleLabel = groupedItem.isCustomBundle
                      ? "Custom Bundle"
                      : "Recommended Bundle"
                    const title = groupedItem.isBundle
                      ? getBundleTitle(item)
                      : item.title
                    const productDetails = groupedItem.lineItems.map(
                      (lineItem) => ({
                        id: lineItem.id,
                        lineItem,
                        title:
                          lineItem.product_title || lineItem.title || "Item",
                        weightG: getLineWeightG(lineItem),
                        thumbnail: lineItem.thumbnail,
                        images: lineItem.variant?.product?.images,
                        handle: lineItem.product_handle,
                      })
                    )

                    return (
                      <div
                        className="grid grid-cols-[122px_1fr] gap-x-4"
                        key={groupedItem.key}
                        data-testid="cart-item"
                      >
                        <div className="w-24">
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </div>
                        <div className="flex flex-col justify-between flex-1">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col overflow-ellipsis whitespace-nowrap mr-4 w-[180px]">
                                <h3 className="text-base-regular overflow-hidden text-ellipsis">
                                  <div data-testid="product-link">{title}</div>
                                </h3>

                                {groupedItem.isBundle ? (
                                  <span className="text-xs text-ui-fg-muted">
                                    {bundleLabel}
                                  </span>
                                ) : null}

                                <span
                                  data-testid="cart-item-quantity"
                                  data-value={groupedItem.totalQuantity}
                                >
                                  Quantity:{" "}
                                  {Number.isInteger(quantityKg)
                                    ? quantityKg
                                    : quantityKg.toFixed(1)}{" "}
                                  kg
                                </span>
                                {groupedItem.isBundle ? (
                                  <div className="mt-2 flex flex-col gap-2 text-xs text-ui-fg-subtle whitespace-normal">
                                    {productDetails.map((entry) => (
                                      <div
                                        key={entry.id}
                                        className="flex items-start gap-2"
                                      >
                                        <div className="w-10 h-10 shrink-0 overflow-hidden rounded-md border border-ui-border-base">
                                          <Thumbnail
                                            thumbnail={entry.thumbnail}
                                            images={entry.images}
                                            size="square"
                                          />
                                        </div>
                                        <div className="flex min-w-0 flex-col gap-1">
                                          <span>
                                            {entry.title} -{" "}
                                            {formatWeight(entry.weightG)}
                                          </span>
                                          {groupedItem.isCustomBundle ? (
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  decrementLineBy100g(
                                                    entry.lineItem
                                                  )
                                                }
                                                disabled={
                                                  activeGroupKey === entry.id
                                                }
                                                className="px-2 py-1 text-xs border border-ui-border-base rounded-md hover:bg-ui-bg-subtle disabled:opacity-50"
                                              >
                                                -100g
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  incrementLineBy100g(
                                                    entry.lineItem
                                                  )
                                                }
                                                disabled={
                                                  activeGroupKey === entry.id
                                                }
                                                className="px-2 py-1 text-xs border border-ui-border-base rounded-md hover:bg-ui-bg-subtle disabled:opacity-50"
                                              >
                                                +100g
                                              </button>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex justify-end">
                                <div className="flex flex-col gap-x-2 text-ui-fg-subtle items-end">
                                  <div className="text-left">
                                    {hasReducedPrice ? (
                                      <p>
                                        <span className="line-through text-ui-fg-muted">
                                          {convertToLocale({
                                            amount: groupedItem.originalTotal,
                                            currency_code:
                                              cartState.currency_code,
                                          })}
                                        </span>
                                      </p>
                                    ) : null}
                                    <span className="text-base-regular">
                                      {convertToLocale({
                                        amount: displayTotal,
                                        currency_code: cartState.currency_code,
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {canChangeQuantity ? (
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => decrementBy100g(groupedItem)}
                                disabled={isUpdating}
                                className="px-2 py-1 text-xs border border-ui-border-base rounded-md hover:bg-ui-bg-subtle disabled:opacity-50"
                              >
                                -100g
                              </button>
                              <button
                                type="button"
                                onClick={() => incrementBy100g(groupedItem)}
                                disabled={isUpdating}
                                className="px-2 py-1 text-xs border border-ui-border-base rounded-md hover:bg-ui-bg-subtle disabled:opacity-50"
                              >
                                +100g
                              </button>
                            </div>
                          ) : null}
                          <button
                            onClick={() =>
                              removeGroupedItems(
                                groupedItem.itemIds,
                                groupedItem.key
                              )
                            }
                            disabled={isUpdating}
                            className="mt-1"
                            data-testid="cart-item-remove-button"
                          >
                            <span className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer text-small-regular">
                              {isUpdating ? (
                                <Spinner className="animate-spin" />
                              ) : (
                                <Trash />
                              )}
                              <span>Remove</span>
                            </span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="p-4 flex flex-col gap-y-4 text-small-regular">
                  <div className="flex items-center justify-between">
                    <span className="text-ui-fg-base font-semibold">
                      Subtotal{" "}
                      <span className="font-normal">(excl. taxes)</span>
                    </span>
                    <span
                      className="text-large-semi"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button
                      className="w-full bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-light))] text-white"
                      size="large"
                      data-testid="go-to-cart-button"
                    >
                      Go to cart
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div>
                <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                  <div className="bg-gray-900 text-small-regular flex items-center justify-center w-6 h-6 rounded-full text-white">
                    <span>0</span>
                  </div>
                  <span>Your shopping bag is empty.</span>
                  <div>
                    <LocalizedClientLink href="/bundles">
                      <>
                        <span className="sr-only">Go to Bundles page</span>
                        <Button onClick={close}>Explore Bundles</Button>
                      </>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
