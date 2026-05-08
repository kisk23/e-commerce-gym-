import type { ICartModuleService } from "@medusajs/types"
import SubscriptionModuleService from "../service"

export const SUBSCRIPTION_DISCOUNT_CODE = "SUBSCRIPTION_PLAN_DISCOUNT"
export const SUBSCRIPTION_DISCOUNT_PROVIDER = "subscription"
const MAX_DISCOUNT_BPS = 9_999

const toAmount = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (value && typeof value === "object") {
    const withValue = value as { value?: unknown; raw?: unknown }
    return toAmount(withValue.value ?? withValue.raw)
  }

  return 0
}

export const isSubscriptionPlanLineItem = (metadata: Record<string, unknown> = {}) => {
  const rawFlag = metadata.subscription_plan_purchase
  return rawFlag === true || rawFlag === "true" || rawFlag === 1 || rawFlag === "1"
}

type ApplySubscriptionDiscountInput = {
  cartId: string
  customerId?: string
  cartModuleService: ICartModuleService
  subscriptionService: SubscriptionModuleService
}

export const applySubscriptionDiscountToCart = async ({
  cartId,
  customerId,
  cartModuleService,
  subscriptionService,
}: ApplySubscriptionDiscountInput) => {
  const cart = await cartModuleService.retrieveCart(cartId, {
    relations: ["items", "items.adjustments"],
  })

  const resolvedCustomerId = customerId || cart.customer_id || undefined
  const activeSubscription = resolvedCustomerId
    ? await subscriptionService.getActiveSubscriptionForCustomer(resolvedCustomerId)
    : null

  const rawDiscountPercentage = Number(activeSubscription?.discount_percentage || 0)
  const normalizedDiscountPercentage = Number.isFinite(rawDiscountPercentage)
    ? Math.max(0, Math.min(99.99, rawDiscountPercentage))
    : 0
  const discountBps = Math.max(0, Math.min(MAX_DISCOUNT_BPS, Math.round(normalizedDiscountPercentage * 100)))
  const discountPercentage = discountBps / 100

  const items = cart.items || []
  const existingSubscriptionAdjustments = items.flatMap((item) =>
    (item.adjustments || []).filter(
      (adjustment) =>
        adjustment.code === SUBSCRIPTION_DISCOUNT_CODE ||
        adjustment.provider_id === SUBSCRIPTION_DISCOUNT_PROVIDER
    )
  )

  if (existingSubscriptionAdjustments.length) {
    await cartModuleService.deleteLineItemAdjustments(
      existingSubscriptionAdjustments.map((adjustment) => adjustment.id)
    )
  }

  if (discountPercentage <= 0) {
    return {
      activeSubscription,
      discountPercentage,
    }
  }

  const eligibleItems = items
    .filter((item) => {
      const metadata = (item.metadata || {}) as Record<string, unknown>
      if (isSubscriptionPlanLineItem(metadata)) {
        return false
      }

      if (item.is_giftcard) {
        return false
      }

      return true
    })
    .map((item) => ({
      id: item.id,
      total: Math.max(0, toAmount(item.unit_price) * toAmount(item.quantity)),
    }))
    .filter((item) => item.total > 0)

  const baseTotal = eligibleItems.reduce((total, item) => total + item.total, 0)
  const discountValue = Math.round((baseTotal * discountBps) / 10_000)
  const discountLabel = `${discountPercentage.toFixed(2).replace(/\.?0+$/, "")}%`

  if (baseTotal <= 0 || discountValue <= 0) {
    return {
      activeSubscription,
      discountPercentage,
    }
  }

  let remainingDiscount = discountValue

  const adjustments = eligibleItems
    .map((item, index) => {
      const isLastItem = index === eligibleItems.length - 1
      const proportionalDiscount = isLastItem
        ? remainingDiscount
        : Math.round((item.total / baseTotal) * discountValue)
      const appliedDiscount = Math.min(remainingDiscount, proportionalDiscount)
      remainingDiscount -= appliedDiscount

      return {
        item_id: item.id,
        code: SUBSCRIPTION_DISCOUNT_CODE,
        provider_id: SUBSCRIPTION_DISCOUNT_PROVIDER,
        amount: Math.max(0, appliedDiscount),
        description: `Subscription discount (${discountLabel})`,
      }
    })
    .filter((adjustment) => adjustment.amount > 0)

  if (adjustments.length) {
    await cartModuleService.addLineItemAdjustments(adjustments)
  }

  return {
    activeSubscription,
    discountPercentage,
  }
}
