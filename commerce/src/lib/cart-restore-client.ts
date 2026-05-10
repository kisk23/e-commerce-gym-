"use client"

import { addToCart, deleteLineItem, retrieveCartWithCache } from "@lib/data/cart"
import { clearCartSnapshot, isSubscriptionPlanPurchaseItem, readCartSnapshot } from "@lib/cart-snapshot"

const RESTORE_MUTEX_KEY = "medusa_cart_snapshot_restore_lock_v1"
const MUTEX_TTL_MS = 30 * 1000

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`
}

const makeItemKey = (variantId: string, metadata?: Record<string, unknown>) =>
  `${variantId}::${metadata ? stableStringify(metadata) : ""}`

const tryAcquireMutex = () => {
  try {
    const now = Date.now()
    const raw = window.localStorage.getItem(RESTORE_MUTEX_KEY)
    const parsed = raw ? (JSON.parse(raw) as { expiresAt?: number } | null) : null
    if (parsed?.expiresAt && now < parsed.expiresAt) {
      return false
    }
    window.localStorage.setItem(
      RESTORE_MUTEX_KEY,
      JSON.stringify({ expiresAt: now + MUTEX_TTL_MS })
    )
    return true
  } catch {
    // If storage fails, fall back to no mutex (best effort).
    return true
  }
}

const releaseMutex = () => {
  try {
    window.localStorage.removeItem(RESTORE_MUTEX_KEY)
  } catch {
    // ignore
  }
}

/**
 * Restores non-subscription items from localStorage snapshot.
 * Always removes subscription plan purchase items first.
 * Idempotent: will only add missing quantity (prevents doubling).
 */
export async function restoreCartFromSnapshot(countryCode: string) {
  const snapshot = readCartSnapshot()
  if (!snapshot) return { didRun: false }

  if (!tryAcquireMutex()) return { didRun: true, skippedBecauseLocked: true }

  try {
    const cart = await retrieveCartWithCache(undefined, "*items, *items.metadata", "no-store")

    const subscriptionItems = (cart?.items || []).filter((i: any) =>
      isSubscriptionPlanPurchaseItem(i)
    )
    for (const item of subscriptionItems) {
      if (item?.id) {
        await deleteLineItem(String(item.id))
      }
    }

    // Re-read after deletions to compute what already exists.
    const cartAfter = await retrieveCartWithCache(
      undefined,
      "*items, *items.metadata",
      "no-store"
    )

    const existingQtyByKey = new Map<string, number>()
    for (const item of (cartAfter?.items || []) as any[]) {
      if (!item?.variant_id) continue
      if (isSubscriptionPlanPurchaseItem(item)) continue
      const key = makeItemKey(String(item.variant_id), (item.metadata || undefined) as any)
      existingQtyByKey.set(key, (existingQtyByKey.get(key) || 0) + Number(item.quantity || 0))
    }

    for (const snapItem of snapshot.items || []) {
      const key = makeItemKey(snapItem.variantId, snapItem.metadata)
      const existingQty = existingQtyByKey.get(key) || 0
      const desiredQty = Math.max(1, Math.floor(Number(snapItem.quantity || 1)))
      const toAdd = Math.max(0, desiredQty - existingQty)
      if (toAdd <= 0) continue

      await addToCart({
        variantId: snapItem.variantId,
        quantity: toAdd,
        countryCode,
        metadata: snapItem.metadata,
      })
    }

    clearCartSnapshot()
    return { didRun: true, restored: true }
  } catch (e) {
    // keep snapshot for retry
    return { didRun: true, restored: false, error: e }
  } finally {
    releaseMutex()
  }
}

