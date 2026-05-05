import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"

import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const cartWithMetadata = await retrieveCart(cart.id, "id,metadata")
  const normalizedCart = {
    ...cart,
    metadata: cartWithMetadata?.metadata ?? cart.metadata,
  }

  const customer = await retrieveCustomer()

  // FORCE LOGIN
  if (!customer) {
    redirect("/account?redirect=/checkout")
  }

  return (
    <PaymentWrapper cart={normalizedCart}>
      <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-20 gap-y-12 py-12">
        <CheckoutForm cart={normalizedCart} customer={customer} />
        <CheckoutSummary cart={normalizedCart} />
      </div>
    </PaymentWrapper>
  )
}
