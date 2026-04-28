"use client"

import { HttpTypes } from "@medusajs/types"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
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
const BUNDLE_STORAGE_KEY = "custom_bundle_items_v1"

const toSafeWeight = (value: number) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return MIN_ITEM_WEIGHT_G
  }

  const roundedToStep = Math.round(parsed / WEIGHT_STEP_G) * WEIGHT_STEP_G
  return Math.max(MIN_ITEM_WEIGHT_G, roundedToStep)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object"

const parseStoredBundleItems = (value: string): BundleSelectionItem[] => {
  const parsed = JSON.parse(value)

  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed
    .filter((entry): entry is Record<string, unknown> => isRecord(entry))
    .map((entry) => {
      const product = isRecord(entry.product) ? entry.product : null
      const productId = typeof product?.id === "string" ? product.id : ""
      const variantId = typeof entry.variantId === "string" ? entry.variantId : ""
      const key =
        typeof entry.key === "string" && entry.key
          ? entry.key
          : toBundleItemKey(productId, variantId)
      const quantity = toSafeWeight(Number(entry.quantity))

      if (!product || !productId || !variantId || !key) {
        return null
      }

      return {
        key,
        product: product as HttpTypes.StoreProduct,
        variantId,
        quantity,
      }
    })
    .filter((entry): entry is BundleSelectionItem => !!entry)
}

export const BundleProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<BundleSelectionItem[]>([])
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BUNDLE_STORAGE_KEY)

      if (stored) {
        const parsedItems = parseStoredBundleItems(stored)
        setItems(parsedItems)
      }
    } catch (error) {
      console.error("[bundle-context] Failed to restore bundle items", error)
      window.localStorage.removeItem(BUNDLE_STORAGE_KEY)
    } finally {
      setHasHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    try {
      window.localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error("[bundle-context] Failed to persist bundle items", error)
    }
  }, [items, hasHydrated])

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
