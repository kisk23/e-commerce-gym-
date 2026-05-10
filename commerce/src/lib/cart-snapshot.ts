export const CART_SNAPSHOT_STORAGE_KEY = "medusa_cart_snapshot_v1"

export type CartSnapshotItem = {
  variantId: string
  quantity: number
  metadata?: Record<string, unknown>
}

type CartSnapshotPayload = {
  v: 1
  createdAt: number
  expiresAt: number
  items: CartSnapshotItem[]
}

const SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000

export const isSubscriptionPlanPurchaseItem = (item: {
  metadata?: Record<string, unknown> | null
}) => {
  const metadata = (item?.metadata || {}) as Record<string, unknown>
  const rawFlag = metadata.subscription_plan_purchase
  return rawFlag === true || rawFlag === "true" || rawFlag === 1 || rawFlag === "1"
}

export const clearCartSnapshot = () => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(CART_SNAPSHOT_STORAGE_KEY)
  } catch {
    // ignore storage failures
  }
}

export const saveCartSnapshot = (items: CartSnapshotItem[]) => {
  if (typeof window === "undefined") return false

  const now = Date.now()
  const payload: CartSnapshotPayload = {
    v: 1,
    createdAt: now,
    expiresAt: now + SNAPSHOT_TTL_MS,
    items: (items || [])
      .filter((i) => !!i?.variantId && Number(i.quantity) > 0)
      .map((i) => ({
        variantId: i.variantId,
        quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
        ...(i.metadata && Object.keys(i.metadata).length ? { metadata: i.metadata } : {}),
      })),
  }

  try {
    window.localStorage.setItem(CART_SNAPSHOT_STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export const readCartSnapshot = (): CartSnapshotPayload | null => {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(CART_SNAPSHOT_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<CartSnapshotPayload> | null
    if (!parsed || parsed.v !== 1) {
      clearCartSnapshot()
      return null
    }

    const expiresAt = Number(parsed.expiresAt || 0)
    if (!expiresAt || Date.now() > expiresAt) {
      clearCartSnapshot()
      return null
    }

    const items = Array.isArray(parsed.items) ? parsed.items : []
    return {
      v: 1,
      createdAt: Number(parsed.createdAt || 0),
      expiresAt,
      items: items
        .filter((i) => i && typeof (i as any).variantId === "string")
        .map((i) => ({
          variantId: String((i as any).variantId),
          quantity: Math.max(1, Math.floor(Number((i as any).quantity) || 1)),
          metadata:
            (i as any).metadata && typeof (i as any).metadata === "object"
              ? ((i as any).metadata as Record<string, unknown>)
              : undefined,
        })),
    }
  } catch {
    clearCartSnapshot()
    return null
  }
}

