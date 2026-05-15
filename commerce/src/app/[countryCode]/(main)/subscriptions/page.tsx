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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">Subscriptions</h1>
        <div className="rounded-3xl bg-gradient-to-r from-primary to-primary-light text-white p-8 mb-10 relative overflow-hidden">
          <span className="inline-block bg-white/20 px-4 py-1 rounded-full text-sm mb-4">
            Healthy Savings
          </span>

          <h2 className="text-4xl font-bold">
            Fuel your gains. Save on every order.
          </h2>

          <p className="mt-3 text-lg opacity-90 max-w-xl">
            Join a subscription plan and unlock exclusive discounts on every
            order.
          </p>
        </div>

        <p className="text-gray-500 mb-8 max-w-2xl">
          Choose the plan that matches your fitness journey and start saving on
          every meal bundle.
        </p>
        <div className="rounded-2xl border border-secondary bg-beige-light p-6 mb-8">
          <h3 className="text-lg font-semibold text-primary mb-2">
            Subscription stacking
          </h3>
          <p className="text-sm text-gray-700 leading-6 mb-4">
            If you purchase a new subscription while your current plan is still
            active, your discount is{" "}
            <span className="font-semibold">combined proportionally </span>
            based on the remaining time of your current plan and the duration of
            the new plan.
          </p>
          <div className="text-sm text-gray-700 space-y-1 mb-4">
            <p>Example:</p>
            <p>
              • Current plan: 1 day remaining at <strong>10%</strong>
            </p>
            <p>
              • New plan: 3 months at <strong>15%</strong>
            </p>
          </div>
          <p className="text-sm text-gray-700 mt-4">
            Your effective discount becomes approximately{" "}
            <span className="font-semibold text-primary">14.95%</span>.
          </p>
        </div>

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
