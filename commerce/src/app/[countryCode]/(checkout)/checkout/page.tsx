import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"

import { CheckoutProvider } from "@modules/checkout/components/checkout-context"
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

  const customer = await retrieveCustomer()

  // FORCE LOGIN
  if (!customer) {
    redirect("/account?redirect=/checkout")
  }

  return (
    <CheckoutProvider>
      {/* Page header */}
      <div className="bg-gradient-to-r from-primary/5 via-beige/30 to-secondary/10 border-b border-[#e2e0d8] py-16">
        <div className="content-container">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete your order and get fresh produce delivered
          </p>
        </div>
      </div>
      <div className="flex flex-wrap w-full items-start  lg:justify-between justify-center content-container gap-x-5 py-12">
        <PaymentWrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </PaymentWrapper>
        <CheckoutSummary cart={cart} />
      </div>
    </CheckoutProvider>
  )
}
