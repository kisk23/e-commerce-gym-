"use client"

import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import PaymentButton from "@modules/checkout/components/payment-button"
import { useCheckout } from "@modules/checkout/components/checkout-context"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const { errors } = useCheckout()
  const cartMetadata = (cart.metadata || {}) as Record<string, unknown>

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
    typeof cartMetadata.subscription_intent_plan_title === "string"
      ? cartMetadata.subscription_intent_plan_title
      : null
  const subscriptionPlanId =
    typeof cartMetadata.subscription_intent_plan_id === "string"
      ? cartMetadata.subscription_intent_plan_id
      : null
  const subscriptionDuration =
    typeof cartMetadata.subscription_intent_duration_months === "number"
      ? cartMetadata.subscription_intent_duration_months
      : Number(cartMetadata.subscription_intent_duration_months || 0)
  const subscriptionDiscount =
    typeof cartMetadata.subscription_intent_discount_percentage === "number"
      ? cartMetadata.subscription_intent_discount_percentage
      : Number(cartMetadata.subscription_intent_discount_percentage || 0)
  const subscriptionPriceAmount =
    typeof cartMetadata.subscription_intent_price_amount === "number"
      ? cartMetadata.subscription_intent_price_amount
      : Number(cartMetadata.subscription_intent_price_amount || 0)

  const hasSubscriptionIntent = Boolean(subscriptionPlanTitle || subscriptionPlanId)

  return (
    <div className="rounded-2xl border w-full lg:max-w-fit max-w-[700px] p-6 shadow-sm mx-auto sticky top-6">
      <h2 className="text-base font-semibold mb-5 tracking-tight">
        Order Summary
      </h2>

      {/* Line items */}
      <div className="space-y-2 mb-5 pb-5 border-b border-[#f0ede4]">
        {cart.items?.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center text-sm"
          >
            <span className="text-gray-500">
              {item.title} × {item.quantity}
            </span>
            <span className="font-medium">
              {convertToLocale({
                amount: item.unit_price * item.quantity,
                currency_code: cart.currency_code,
              })}
            </span>
          </div>
        ))}
        {!cart.items?.length && (
          <p className="text-sm text-[#b0ad9e]">Your cart is empty.</p>
        )}
      </div>

      {/* Totals */}
      <div className="space-y-2.5 mb-6">
        <div className="flex justify-between text-sm ">
          <span className="text-gray-500 ">Subtotal</span>
          <span>{subtotal}</span>
        </div>
        <div className="flex justify-between text-sm ">
          <span className="text-gray-500">Delivery</span>
          <span>{deliveryTotal}</span>
        </div>
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
          <p className="text-sm font-medium">
            {subscriptionPlanTitle || subscriptionPlanId}
          </p>
          <p className="text-xs text-gray-500">
            {Math.max(0, subscriptionDuration)} month(s) •{" "}
            {Math.max(0, subscriptionDiscount)}% discount
          </p>
          <p className="text-xs text-gray-500">
            Price amount: {Math.max(0, subscriptionPriceAmount)}
          </p>
          <p className="text-xs text-gray-500">
            This plan will be activated after successful checkout.
          </p>
        </div>
      )}

      {/* Validation errors */}
      {errors.length > 0 && (
        <div
          id="checkout-errors"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 space-y-1"
        >
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">
            Please fix the following:
          </p>
          {errors.map((err, i) => (
            <p
              key={i}
              className="text-xs text-red-500 flex items-start gap-1.5"
            >
              <span className="mt-px">•</span>
              {err}
            </p>
          ))}
        </div>
      )}

      {/* CTA — always active */}
      {/* <PaymentButton cart={cart} data-testid="submit-order-button" /> */}

      <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1.5">
        Your payment information is secure and encrypted
      </p>
    </div>
  )
}

export default CheckoutSummary
