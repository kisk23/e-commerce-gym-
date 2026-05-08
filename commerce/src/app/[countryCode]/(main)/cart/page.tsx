import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { listMySubscriptions } from "@lib/data/subscriptions"
import CartTemplate from "@modules/cart/templates"
import CartRestorer from "@modules/order/components/cart-restorer"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()
  const mySubscriptions = customer
    ? await listMySubscriptions()
    : { subscriptions: [], active_subscription: null }

  return (
    <>
      <CartRestorer />
      <CartTemplate
        cart={cart}
        customer={customer}
        activeSubscription={mySubscriptions.active_subscription}
      />
    </>
  )
}
