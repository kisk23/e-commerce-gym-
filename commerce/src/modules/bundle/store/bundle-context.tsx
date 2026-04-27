"use client"

import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, useMemo, useState } from "react"
import { BundleSelectionItem } from "../utils/bundle-calculations"

type AddBundleItemInput = {
  product: HttpTypes.StoreProduct
  variantId: string
  quantity: number
}

type BundleContextValue = {
  items: BundleSelectionItem[]
  addItem: (_input: AddBundleItemInput) => void
  removeItem: (_key: string) => void
  updateQuantity: (_key: string, _quantity: number) => void
  clearItems: () => void
}

const BundleContext = createContext<BundleContextValue | null>(null)

const toBundleItemKey = (productId: string, variantId: string) =>
  `${productId}:${variantId}`
const WEIGHT_STEP_G = 100
const MIN_ITEM_WEIGHT_G = 1000
const toSafeWeight = (value: number) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return MIN_ITEM_WEIGHT_G
  }

  const roundedToStep = Math.round(parsed / WEIGHT_STEP_G) * WEIGHT_STEP_G
  return Math.max(MIN_ITEM_WEIGHT_G, roundedToStep)
}

export const BundleProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<BundleSelectionItem[]>([])

  const addItem = ({ product, variantId, quantity }: AddBundleItemInput) => {
    if (!variantId) {
      return
    }

    const safeQuantity = toSafeWeight(quantity)
    const key = toBundleItemKey(product.id, variantId)

    setItems((previousItems) => {
      const existingItem = previousItems.find((item) => item.key === key)

      if (!existingItem) {
        return [
          ...previousItems,
          {
            key,
            product,
            variantId,
            quantity: safeQuantity,
          },
        ]
      }

      return previousItems.map((item) =>
        item.key === key
          ? { ...item, quantity: item.quantity + safeQuantity }
          : item
      )
    })
  }

  const removeItem = (key: string) => {
    setItems((previousItems) =>
      previousItems.filter((item) => item.key !== key)
    )
  }

  const updateQuantity = (key: string, quantity: number) => {
    const safeQuantity = toSafeWeight(quantity)

    setItems((previousItems) =>
      previousItems.map((item) =>
        item.key === key ? { ...item, quantity: safeQuantity } : item
      )
    )
  }

  const clearItems = () => {
    setItems([])
  }

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearItems,
    }),
    [items]
  )

  return (
    <BundleContext.Provider value={value}>{children}</BundleContext.Provider>
  )
}

export const useBundleContext = () => {
  const context = useContext(BundleContext)

  if (!context) {
    throw new Error("useBundleContext must be used inside <BundleProvider>")
  }

  return context
}
