import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { getOrSetCart, retrieveCartWithCache } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getAuthHeaders } from "@lib/data/cookies"
import { sdk } from "@lib/config"

import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"

export const metadata: Metadata = {
  title: "Subscription Checkout",
}

export const dynamic = "force-dynamic"

export default async function SubscriptionCheckout({
  params,
}: {
  params: { countryCode: string }
}) {
  const countryCode = params?.countryCode || "us"
  const cart =
    (await retrieveCartWithCache(undefined, undefined, "no-store")) ||
    (await getOrSetCart(countryCode))

  if (!cart) {
    return notFound()
  }

  const hasSubscriptionPlan = (cart.items || []).some((item) => {
    const metadata = (item.metadata || {}) as Record<string, unknown>
    const rawFlag = metadata.subscription_plan_purchase
    return (
      rawFlag === true || rawFlag === "true" || rawFlag === 1 || rawFlag === "1"
    )
  })

  if (!hasSubscriptionPlan) {
    redirect(`/${countryCode}/checkout?step=payment`)
  }

  // Remove any non-subscription items from the cart for safety
  if (cart.items && cart.items.length > 0) {
    const nonSubscriptionItems = (cart.items || []).filter((item) => {
      const metadata = (item.metadata || {}) as Record<string, unknown>
      const rawFlag = metadata.subscription_plan_purchase
      return !(rawFlag === true || rawFlag === "true" || rawFlag === 1 || rawFlag === "1")
    })

    if (nonSubscriptionItems.length > 0) {
      try {
        const authHeaders = await getAuthHeaders()
        for (const item of nonSubscriptionItems) {
          if (item.id) {
            await sdk.store.cart.deleteLineItem(cart.id, item.id, {}, authHeaders).catch(() => null)
          }
        }
      } catch {
        // Continue if removal fails
      }
    }
  }

  const cartWithMetadata = await retrieveCartWithCache(
    cart.id,
    "id,metadata",
    "no-store"
  )
  const normalizedCart = {
    ...cart,
    metadata: cartWithMetadata?.metadata ?? cart.metadata,
  }

  const customer = await retrieveCustomer()

  if (!customer) {
    redirect(
      `/${countryCode}/account?redirect=/${countryCode}/subscription-checkout`
    )
  }

  return (
    <PaymentWrapper cart={normalizedCart}>
      <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-20 gap-y-12 py-12">
        <CheckoutForm
          cart={normalizedCart}
          customer={customer}
          mode="subscription"
        />
        <CheckoutSummary cart={normalizedCart} />
      </div>
    </PaymentWrapper>
  )
}
