import { Metadata } from "next"

import { retrieveCustomer } from "@lib/data/customer"
import { retrieveCartWithCache } from "@lib/data/cart"
import {
  listMySubscriptions,
  listSubscriptionPlans,
} from "@lib/data/subscriptions"
import Subscriptions from "@modules/account/components/subscriptions"

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Choose a prepaid plan and save on every order.",
}

export default async function SubscriptionsPage() {
  const [plans, customer, cart] = await Promise.all([
    listSubscriptionPlans(),
    retrieveCustomer(),
    retrieveCartWithCache(undefined, "*items, *items.metadata", "no-store"),
  ])

  const mySubscriptions = customer
    ? await listMySubscriptions()
    : {
        subscriptions: [],
        active_subscription: null,
      }

  return (
    <div className="content-container py-10">
      <div className="max-w-3xl">
        <h1 className="text-2xl-semi">Subscriptions</h1>
        <p className="text-base-regular text-ui-fg-subtle mt-2 mb-6">
          Pick a prepaid plan to unlock recurring savings on bundle orders.
        </p>
        <Subscriptions
          plans={plans}
          activeSubscription={mySubscriptions.active_subscription}
          isAuthenticated={!!customer}
          cartItems={cart?.items ?? []}
        />
      </div>
    </div>
  )
}
