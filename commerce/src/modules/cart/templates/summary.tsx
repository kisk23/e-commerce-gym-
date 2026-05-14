"use client"
import { Button, Heading } from "@medusajs/ui"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { StoreCustomerSubscription } from "@lib/types/subscription"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
  activeSubscription?: StoreCustomerSubscription | null
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart, activeSubscription = null }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const currencyCode = cart.currency_code
  // Items-only subtotal (excludes delivery/shipping).
  const subtotal = Number(cart.item_subtotal ?? 0)
  const delivery = Number(cart.shipping_subtotal ?? 0)
  const discount = Number((cart as any).discount_subtotal ?? 0)
  const total = Number(cart.total ?? 0)
  const hasSelectedDeliveryMethod = (cart.shipping_methods?.length ?? 0) > 0
  // Subscription discount is only shown for authenticated customers with an active subscription.
  // We gate on the activeSubscription prop rather than reading raw adjustments from the cart,
  // which prevents stale adjustments (from a prior logged-in session) from showing for guests.
  const subscriptionAdjustments = activeSubscription
    ? (cart.items || []).flatMap((item) =>
        ((item as any).adjustments || []).filter((adjustment: any) => {
          return (
            adjustment?.code === "SUBSCRIPTION_PLAN_DISCOUNT" ||
            adjustment?.provider_id === "subscription"
          )
        })
      )
    : []
  const subscriptionDiscountAmount = subscriptionAdjustments.reduce(
    (sum, adjustment: any) => sum + Number(adjustment?.amount || 0),
    0
  )
  const subscriptionDiscountDescription =
    typeof subscriptionAdjustments[0]?.description === "string"
      ? subscriptionAdjustments[0].description
      : ""
  const subscriptionDiscountPercentageMatch =
    subscriptionDiscountDescription.match(/\((\d+)%\)/)
  const subscriptionDiscountPercentage = subscriptionDiscountPercentageMatch
    ? Number(subscriptionDiscountPercentageMatch[1])
    : null
  const freeDeliveryTarget = 1000
  const remainingForFreeDelivery = Math.max(0, freeDeliveryTarget - subtotal)
  const freeDeliveryMessage =
    remainingForFreeDelivery > 0
      ? `Add ${convertToLocale({
          amount: remainingForFreeDelivery,
          currency_code: currencyCode,
        })} more for free delivery`
      : "Free delivery unlocked"

  return (
    <div className="rounded-[20px] border border-[#E6E6E6] bg-white shadow-[0px_2px_5px_rgba(0,0,0,0.12)] p-6 flex flex-col gap-5">
      <div className="flex flex-col gap-6">
        <div className="pb-6 border-b border-[#E6E6E6]">
          <Heading
            level="h2"
            className="text-[28px] leading-7 font-semibold text-[#0A0A0A] mb-6"
          >
            Order Summary
          </Heading>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm leading-5 text-[#717182]">Subtotal</span>
              <span
                className="text-sm leading-5 font-medium text-[#0A0A0A]"
                data-testid="cart-subtotal"
                data-value={subtotal}
              >
                {convertToLocale({
                  amount: subtotal,
                  currency_code: currencyCode,
                })}
              </span>
            </div>
            {hasSelectedDeliveryMethod ? (
              <div className="flex items-center justify-between">
                <span className="text-sm leading-5 text-[#717182]">
                  Delivery
                </span>
                <span
                  className="text-sm leading-5 font-medium text-[rgb(var(--primary))]"
                  data-testid="cart-shipping"
                  data-value={delivery}
                >
                  {convertToLocale({
                    amount: delivery,
                    currency_code: currencyCode,
                  })}
                </span>
              </div>
            ) : null}
            {discount > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-sm leading-5 text-[#717182]">
                  Discount
                </span>
                <span
                  className="text-sm leading-5 font-medium text-[rgb(var(--primary))]"
                  data-testid="cart-discount"
                  data-value={discount}
                >
                  -{" "}
                  {convertToLocale({
                    amount: discount,
                    currency_code: currencyCode,
                  })}
                </span>
              </div>
            ) : null}
            {discount <= 0 && subscriptionDiscountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm leading-5 text-[#717182]">
                  Subscription discount
                  {subscriptionDiscountPercentage !== null
                    ? ` (${subscriptionDiscountPercentage}%)`
                    : ""}
                </span>
                <span
                  className="text-sm leading-5 font-medium text-[rgb(var(--primary))]"
                  data-testid="cart-subscription-discount"
                  data-value={subscriptionDiscountAmount}
                >
                  -{" "}
                  {convertToLocale({
                    amount: subscriptionDiscountAmount,
                    currency_code: currencyCode,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <span className="text-[18px] leading-7 font-semibold text-[#0A0A0A]">
              Total
            </span>
            <span
              className="text-[32px] leading-8 font-semibold text-[rgb(var(--primary))]"
              data-testid="cart-total"
              data-value={total}
            >
              {convertToLocale({ amount: total, currency_code: currencyCode })}
            </span>
          </div>

          <LocalizedClientLink
            href={"/checkout?step=" + step}
            data-testid="checkout-button"
          >
            <Button className="w-full h-10 rounded-xl bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary-light))] text-white text-sm font-medium">
              Proceed to Checkout <span aria-hidden>→</span>
            </Button>
          </LocalizedClientLink>
        </div>
      </div>

      <div className="flex flex-col gap-[18px]">
        {activeSubscription ? (
          <div className="rounded-xl border border-[#E6E6E6] bg-white p-4 flex flex-col gap-2">
            <p className="text-sm leading-5 text-center text-[#0A0A0A] font-medium">
              Your subscription
            </p>
            <p className="text-sm leading-5 text-center text-[#717182]">
              {activeSubscription.plan_title} •{" "}
              {activeSubscription.discount_percentage}% off
            </p>
            <LocalizedClientLink href="/subscriptions">
              <button
                type="button"
                className="w-full h-8 rounded-lg border border-[#E6E6E6] bg-white cursor-pointer hover:bg-primary/20 text-sm leading-5 font-medium text-[#0A0A0A]"
              >
                Manage subscription
              </button>
            </LocalizedClientLink>
          </div>
        ) : (
          <div className="rounded-xl border border-[#F0E1CF] bg-[#F5EBDF] p-4 flex flex-col gap-6">
            <p className="text-sm leading-5 text-center text-[#0A0A0A]">
              Subscribe and save up to 12% on every order
            </p>
            <LocalizedClientLink href="/subscriptions">
              <button
                type="button"
                className="w-full h-8 rounded-lg border border-[#E6E6E6] bg-white cursor-pointer hover:bg-primary/20 text-sm leading-5 font-medium text-[#0A0A0A]"
              >
                View Plans
              </button>
            </LocalizedClientLink>
          </div>
        )}
        {/* <p className="text-xs leading-4 text-center text-[#717182]">
          {freeDeliveryMessage}
        </p> */}
      </div>
    </div>
  )
}

export default Summary
