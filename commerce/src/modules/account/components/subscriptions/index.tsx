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
        <div className="rounded-md border border-ui-border-base p-3 bg-ui-bg-subtle">
          <p className="text-base-regular">
            <span className="font-semibold">Current plan:</span>{" "}
            {currentActive.plan_title}
          </p>
          <p className="text-small-regular text-ui-fg-subtle mt-1">
            Discount: {currentActive.discount_percentage}% - {remainingText}
          </p>
          <p className="text-small-regular text-ui-fg-subtle">
            Ends at: {formatDate(currentActive.ends_at)}
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
            className="rounded-md border border-ui-border-base p-3 flex flex-col gap-2"
          >
            <h3 className="text-base-semi">{plan.title}</h3>
            {plan.description ? (
              <p className="text-small-regular text-ui-fg-subtle">
                {plan.description}
              </p>
            ) : null}
            <p className="text-small-regular text-ui-fg-subtle">
              {plan.duration_months} month(s) - {plan.discount_percentage}%
              discount
            </p>
            <p className="text-small-regular text-ui-fg-subtle">
              Price amount: {Number(plan.price_amount || 0)}
            </p>
            <Button
              variant="secondary"
              isLoading={isSubmittingPlanId === plan.id}
              disabled={isSubmittingPlanId !== null || !isAuthenticated}
              onClick={() => onSubscribe(plan)}
            >
              {!isAuthenticated
                ? "Sign in to subscribe"
                : isSubmittingPlanId === plan.id
                ? "Processing..."
                : "Subscribe"}
            </Button>
          </article>
        ))}
      </div>

      {message ? <p className="text-ui-fg-subtle">{message}</p> : null}
    </section>
  )
}

export default Subscriptions
