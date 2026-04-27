"use client"

import { subscribeToPlan } from "@lib/data/subscriptions"
import {
  StoreCustomerSubscription,
  StoreSubscriptionPlan,
} from "@lib/types/subscription"
import { Button } from "@medusajs/ui"
import { useMemo, useState } from "react"

type SubscriptionsProps = {
  plans: StoreSubscriptionPlan[]
  activeSubscription: StoreCustomerSubscription | null
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

const Subscriptions = ({ plans, activeSubscription }: SubscriptionsProps) => {
  const [isSubmittingPlanId, setIsSubmittingPlanId] = useState<string | null>(
    null
  )
  const [message, setMessage] = useState<string | null>(null)
  const [currentActive, setCurrentActive] =
    useState<StoreCustomerSubscription | null>(activeSubscription)

  const remainingText = useMemo(() => {
    if (!currentActive || currentActive.status !== "active") {
      return "No active subscription."
    }

    const days = Math.max(0, Number(currentActive.remaining_days || 0))
    const hours = Math.max(0, Number(currentActive.remaining_hours || 0))
    return `${days}d ${hours}h remaining`
  }, [currentActive])

  const onSubscribe = async (plan: StoreSubscriptionPlan) => {
    setIsSubmittingPlanId(plan.id)
    setMessage(null)

    try {
      const result = await subscribeToPlan(plan.id)
      setCurrentActive(result.subscription)
      setMessage(
        result.action === "extended"
          ? `Subscription extended with ${plan.title}.`
          : `Subscribed to ${plan.title}.`
      )
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
            <Button
              variant="secondary"
              isLoading={isSubmittingPlanId === plan.id}
              disabled={isSubmittingPlanId !== null}
              onClick={() => onSubscribe(plan)}
            >
              {isSubmittingPlanId === plan.id ? "Processing..." : "Subscribe"}
            </Button>
          </article>
        ))}
      </div>

      {message ? <p className="text-ui-fg-subtle">{message}</p> : null}
    </section>
  )
}

export default Subscriptions
