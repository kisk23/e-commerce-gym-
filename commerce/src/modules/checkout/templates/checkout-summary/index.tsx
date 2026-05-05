"use client"

import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { useCheckout } from "@modules/checkout/components/checkout-context"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const { errors } = useCheckout()
  const cartMetadata = (cart.metadata || {}) as Record<string, unknown>

  const toNumber = (value: unknown) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0
    }

    if (typeof value === "string") {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }

    return 0
  }

  const subscriptionPlanItem = (cart.items || []).find((item) => {
    const metadata = (item.metadata || {}) as Record<string, unknown>
    const rawFlag = metadata.subscription_plan_purchase
    return rawFlag === true || rawFlag === "true" || rawFlag === 1 || rawFlag === "1"
  })
  const subscriptionMetadata = (subscriptionPlanItem?.metadata || {}) as Record<string, unknown>

  const subscriptionAdjustments = (cart.items || []).flatMap((item) =>
    ((item as any).adjustments || []).filter((adjustment: any) => {
      return (
        adjustment?.code === "SUBSCRIPTION_PLAN_DISCOUNT" ||
        adjustment?.provider_id === "subscription"
      )
    })
  )

  const subscriptionDiscountAmount = subscriptionAdjustments.reduce(
    (sum, adjustment: any) => sum + toNumber(adjustment?.amount),
    0
  )

  const subscriptionDiscountDescription =
    typeof subscriptionAdjustments[0]?.description === "string"
      ? subscriptionAdjustments[0].description
      : ""
  const subscriptionDiscountPercentageMatch =
    subscriptionDiscountDescription.match(/\((\d+)%\)/)
  const appliedSubscriptionDiscountPercentage = subscriptionDiscountPercentageMatch
    ? toNumber(subscriptionDiscountPercentageMatch[1])
    : 0

  const subtotal = convertToLocale({
    amount: cart.subtotal ?? 0,
    currency_code: cart.currency_code,
  })

  const deliveryTotal = convertToLocale({
    amount: cart.shipping_total ?? 0,
    currency_code: cart.currency_code,
  })

  const grandTotal = convertToLocale({
    amount: cart.total ?? 0,
    currency_code: cart.currency_code,
  })

  const subscriptionPlanTitle =
    (typeof subscriptionMetadata.subscription_plan_title === "string"
      ? subscriptionMetadata.subscription_plan_title
      : null) ||
    (typeof cartMetadata.subscription_checkout_plan_title === "string"
      ? cartMetadata.subscription_checkout_plan_title
      : null)
  const subscriptionPlanId =
    (typeof subscriptionMetadata.subscription_plan_id === "string"
      ? subscriptionMetadata.subscription_plan_id
      : null) ||
    (typeof cartMetadata.subscription_checkout_plan_id === "string"
      ? cartMetadata.subscription_checkout_plan_id
      : null)
  const subscriptionDuration = toNumber(
    subscriptionMetadata.subscription_plan_duration_months ??
      cartMetadata.subscription_checkout_plan_duration_months
  )
  const subscriptionDiscount = toNumber(
    subscriptionMetadata.subscription_plan_discount_percentage ??
      cartMetadata.subscription_checkout_plan_discount_percentage
  )
  const subscriptionPriceAmount = toNumber(
    subscriptionMetadata.subscription_plan_price_amount ??
      cartMetadata.subscription_checkout_plan_price_amount
  )

  const hasSubscriptionIntent = Boolean(subscriptionPlanTitle || subscriptionPlanId)

  return (
    <div className="rounded-2xl border w-full lg:max-w-fit max-w-[700px] p-6 shadow-sm mx-auto sticky top-6">
      <h2 className="text-base font-semibold mb-5 tracking-tight">Order Summary</h2>

      <div className="space-y-2 mb-5 pb-5 border-b border-[#f0ede4]">
        {cart.items?.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-sm">
            <span className="text-gray-500">
              {item.title} x {item.quantity}
            </span>
            <span className="font-medium">
              {convertToLocale({
                amount: item.unit_price * item.quantity,
                currency_code: cart.currency_code,
              })}
            </span>
          </div>
        ))}
        {!cart.items?.length && <p className="text-sm text-[#b0ad9e]">Your cart is empty.</p>}
      </div>

      <div className="space-y-2.5 mb-6">
        <div className="flex justify-between text-sm ">
          <span className="text-gray-500 ">Subtotal</span>
          <span>{subtotal}</span>
        </div>
        <div className="flex justify-between text-sm ">
          <span className="text-gray-500">Delivery</span>
          <span>{deliveryTotal}</span>
        </div>
        {subscriptionDiscountAmount > 0 && (
          <div className="flex justify-between text-sm ">
            <span className="text-gray-500">
              Subscription discount
              {appliedSubscriptionDiscountPercentage > 0
                ? ` (${appliedSubscriptionDiscountPercentage}%)`
                : ""}
            </span>
            <span className="text-[rgb(var(--primary))]">
              -{" "}
              {convertToLocale({
                amount: subscriptionDiscountAmount,
                currency_code: cart.currency_code,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-3 border-t border-[#f0ede4]">
          <span>Total</span>
          <span className="text-xl">{grandTotal}</span>
        </div>
      </div>

      {hasSubscriptionIntent && (
        <div className="mb-6 rounded-xl border border-[#f0ede4] bg-[#faf9f6] p-4 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6e6a57]">
            Selected Subscription Plan
          </p>
          <p className="text-sm font-medium">{subscriptionPlanTitle || subscriptionPlanId}</p>
          <p className="text-xs text-gray-500">
            {Math.max(0, subscriptionDuration)} month(s) - {Math.max(0, subscriptionDiscount)}%
            discount
          </p>
          {subscriptionDiscountAmount > 0 && (
            <p className="text-xs text-gray-500">
              Applied now: -{" "}
              {convertToLocale({
                amount: subscriptionDiscountAmount,
                currency_code: cart.currency_code,
              })}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Price amount: {Math.max(0, subscriptionPriceAmount)}
          </p>
          <p className="text-xs text-gray-500">
            This plan will be activated after successful checkout.
          </p>
        </div>
      )}

      {errors.length > 0 && (
        <div
          id="checkout-errors"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 space-y-1"
        >
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">
            Please fix the following:
          </p>
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-red-500 flex items-start gap-1.5">
              <span className="mt-px">-</span>
              {err}
            </p>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1.5">
        Your payment information is secure and encrypted
      </p>
    </div>
  )
}

export default CheckoutSummary
