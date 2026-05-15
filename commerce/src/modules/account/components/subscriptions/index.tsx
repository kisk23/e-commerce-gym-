"use client"

import { subscribeToPlan } from "@lib/data/subscriptions"
import { clearCartLineItems } from "@lib/data/cart"
import {
  StoreCustomerSubscription,
  StoreSubscriptionPlan,
} from "@lib/types/subscription"
import {
  isSubscriptionPlanPurchaseItem,
  saveCartSnapshot,
} from "@lib/cart-snapshot"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"

type SubscriptionsProps = {
  plans: StoreSubscriptionPlan[]
  activeSubscription: StoreCustomerSubscription | null
  isAuthenticated?: boolean
  cartItems?: Array<{
    variant_id?: string | null
    quantity?: number | null
    metadata?: Record<string, unknown> | null
  }>
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toDateString()
}

const Subscriptions = ({
  plans,
  activeSubscription,
  isAuthenticated = true,
  cartItems = [],
}: SubscriptionsProps) => {
  const params = useParams<{ countryCode?: string | string[] }>()
  const countryCode =
    typeof params.countryCode === "string" ? params.countryCode : "us"

  const [isSubmittingPlanId, setIsSubmittingPlanId] = useState<string | null>(
    null
  )
  const [message, setMessage] = useState<string | null>(null)
  const [currentActive] = useState<StoreCustomerSubscription | null>(
    activeSubscription
  )

  const remainingText = useMemo(() => {
    if (!currentActive || currentActive.status !== "active") {
      return "No active subscription."
    }

    const days = Math.max(0, Number(currentActive.remaining_days || 0))
    const hours = Math.max(0, Number(currentActive.remaining_hours || 0))
    return `${days}d ${hours}h remaining`
  }, [currentActive])

  const onSubscribe = async (plan: StoreSubscriptionPlan) => {
    if (!isAuthenticated) {
      setMessage("Please sign in to subscribe to a plan.")
      return
    }

    setIsSubmittingPlanId(plan.id)
    setMessage(null)

    try {
      const snapshotItems = (cartItems || [])
        .filter((i) => !!i?.variant_id && !isSubscriptionPlanPurchaseItem(i))
        .map((i) => ({
          variantId: String(i.variant_id),
          quantity: Math.max(1, Math.floor(Number(i.quantity || 1))),
          metadata:
            i.metadata && Object.keys(i.metadata).length ? i.metadata : undefined,
        }))

      saveCartSnapshot(snapshotItems)

      // Ensure the cart is empty before inserting the subscription plan purchase.
      await clearCartLineItems()

      setMessage("Redirecting to checkout...")
      await subscribeToPlan(plan.id, countryCode)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not subscribe to this plan."
      )
    } finally {
      setIsSubmittingPlanId(null)
    }
  }

  return (
    <section className="rounded-lg border border-ui-border-base p-4 flex flex-col gap-3">
      <h2 className="text-large-semi">Prepaid Subscriptions</h2>

      {!isAuthenticated ? (
        <div className="rounded-md border border-ui-border-base p-3 bg-ui-bg-subtle">
          <p className="text-small-regular text-ui-fg-subtle">
            Sign in to subscribe and manage your active plan.
          </p>
          <LocalizedClientLink
            href="/account?redirect=/subscriptions"
            className="text-small-semi mt-2 inline-flex"
          >
            Sign in
          </LocalizedClientLink>
        </div>
      ) : null}

      {currentActive ? (
        <div className="rounded-2xl bg-primary text-white p-6">
          <p className="text-sm opacity-80">Your active plan</p>

          <h3 className="text-2xl font-bold mt-1">
            {currentActive.plan_title}
          </h3>

          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs opacity-70">Discount</p>
              <p className="font-semibold">
                {currentActive.discount_percentage}%
              </p>
            </div>

            <div>
              <p className="text-xs opacity-70">Remaining</p>
              <p className="font-semibold">{remainingText}</p>
            </div>
          </div>

          <p className="mt-4 text-sm opacity-80">
            Ends {formatDate(currentActive.ends_at)}
          </p>
        </div>
      ) : (
        <p className="text-ui-fg-subtle">
          No active subscription. Choose a plan below.
        </p>
      )}

      {!plans.length ? (
        <p className="text-ui-fg-subtle">No subscription plans available.</p>
      ) : null}

      <div className="grid grid-cols-1 small:grid-cols-2 gap-3">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="relative rounded-[24px] border border-beige-dark bg-white p-6 shadow-sm hover:shadow-xl transition-all flex flex-col"
          >
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-primary">{plan.title}</h3>

              <p className="text-gray-500 mt-1">{plan.description}</p>
            </div>

            <div className="rounded-2xl bg-beige-light p-5 text-center mb-5">
              <p className="text-sm text-gray-500">Save</p>
              <p className="text-4xl font-bold text-primary">
                {plan.discount_percentage}%
              </p>
              <p className="text-sm text-gray-500">
                for {plan.duration_months} month(s)
              </p>
            </div>

            <p className="text-sm text-gray-600 flex-1 leading-6">
              Eat better, recover faster, and save more with a subscription
              built for active lifestyles.
            </p>

            <Button
              className="mt-6 h-12 rounded-xl bg-primary hover:bg-primary-light text-white font-semibold"
              isLoading={isSubmittingPlanId === plan.id}
              disabled={isSubmittingPlanId !== null || !isAuthenticated}
              onClick={() => onSubscribe(plan)}
            >
              Subscribe Now
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Subscriptions
