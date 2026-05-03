import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

type SubscriptionPlan = {
  id: string
  title: string
  description: string | null
  price_amount: number
  duration_months: number
  discount_percentage: number
  rank: number
  is_active: boolean
}

type Subscriber = {
  id: string
  customer_id: string
  status: string
  plan_title: string
  duration_months: number
  discount_percentage: number
  starts_at: string
  ends_at: string
  remaining_days: number
  remaining_hours: number
  customer: {
    id: string
    email: string | null
    first_name: string | null
    last_name: string | null
  } | null
}

type PlanForm = {
  id: string | null
  title: string
  description: string
  price_amount: number
  duration_months: number
  discount_percentage: number
  rank: number
  is_active: boolean
}

const defaultForm: PlanForm = {
  id: null,
  title: "",
  description: "",
  price_amount: 0,
  duration_months: 3,
  discount_percentage: 5,
  rank: 1,
  is_active: true,
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleDateString()
}

const formatRemaining = (subscription: Subscriber) => {
  if (subscription.status !== "active") {
    return subscription.status
  }

  if (subscription.remaining_days <= 0 && subscription.remaining_hours <= 0) {
    return "expired"
  }

  return `${subscription.remaining_days}d ${subscription.remaining_hours}h`
}

const SubscriptionsPage = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [form, setForm] = useState<PlanForm>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const resetForm = () => {
    setForm(defaultForm)
  }

  const loadData = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const [plansResponse, subscribersResponse] = await Promise.all([
        fetch("/admin/subscriptions/plans"),
        fetch("/admin/subscriptions/users"),
      ])

      if (!plansResponse.ok || !subscribersResponse.ok) {
        setMessage("Could not load subscription data.")
        return
      }

      const plansBody = (await plansResponse.json()) as { plans?: SubscriptionPlan[] }
      const subscribersBody = (await subscribersResponse.json()) as { subscribers?: Subscriber[] }

      setPlans(plansBody.plans || [])
      setSubscribers(subscribersBody.subscribers || [])
    } catch {
      setMessage("Could not load subscription data.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const savePlan = async () => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const method = form.id ? "PUT" : "POST"
      const url = form.id ? `/admin/subscriptions/plans/${form.id}` : "/admin/subscriptions/plans"
      const response = await fetch(url, {
        method,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price_amount: form.price_amount,
          duration_months: form.duration_months,
          discount_percentage: form.discount_percentage,
          rank: form.rank,
          is_active: form.is_active,
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null
        setMessage(body?.message || "Could not save plan.")
        return
      }

      setMessage(form.id ? "Plan updated." : "Plan created.")
      resetForm()
      await loadData()
    } catch {
      setMessage("Could not save plan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const editPlan = (plan: SubscriptionPlan) => {
    setForm({
      id: plan.id,
      title: plan.title,
      description: plan.description || "",
      price_amount: Number(plan.price_amount || 0),
      duration_months: Number(plan.duration_months || 0),
      discount_percentage: Number(plan.discount_percentage || 0),
      rank: Number(plan.rank || 0),
      is_active: !!plan.is_active,
    })
    setMessage(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const deactivatePlan = async (planId: string) => {
    if (!confirm("Deactivate this plan?")) {
      return
    }

    setMessage(null)

    try {
      const response = await fetch(`/admin/subscriptions/plans/${planId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        setMessage("Could not deactivate plan.")
        return
      }

      setMessage("Plan deactivated.")
      await loadData()
    } catch {
      setMessage("Could not deactivate plan.")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <section className="rounded-lg border border-ui-border-base p-4 bg-ui-bg-base">
        <h1 className="text-xl font-semibold mb-2">
          {form.id ? "Edit Subscription Plan" : "Create Subscription Plan"}
        </h1>
        <p className="text-ui-fg-subtle mb-4">
          Configure prepaid plans and discount percentages.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            placeholder="Plan title"
            className="rounded-md border border-ui-border-base px-3 py-2"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <input
            placeholder="Description"
            className="rounded-md border border-ui-border-base px-3 py-2"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
          <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
            Price Amount
            <input
              type="number"
              min={0}
              value={form.price_amount}
              className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  price_amount: Math.max(0, Math.round(Number(event.target.value) || 0)),
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
            Duration (months)
            <input
              type="number"
              min={1}
              value={form.duration_months}
              className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  duration_months: Math.max(1, Math.round(Number(event.target.value) || 1)),
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
            Discount (%)
            <input
              type="number"
              min={0}
              max={99}
              value={form.discount_percentage}
              className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  discount_percentage: Math.max(
                    0,
                    Math.min(99, Math.round(Number(event.target.value) || 0))
                  ),
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
            Display rank
            <input
              type="number"
              min={0}
              value={form.rank}
              className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  rank: Math.max(0, Math.round(Number(event.target.value) || 0)),
                }))
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-ui-fg-base">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_active: event.target.checked }))
              }
            />
            Active
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={savePlan}
            disabled={isSubmitting || !form.title.trim()}
            className="rounded-md bg-ui-bg-interactive text-ui-fg-on-color px-4 py-2 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : form.id ? "Update plan" : "Create plan"}
          </button>
          {form.id ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-ui-border-base px-4 py-2"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-ui-border-base p-4 bg-ui-bg-base">
        <h2 className="text-lg font-semibold mb-3">Plans</h2>
        {isLoading ? <p className="text-ui-fg-subtle">Loading plans...</p> : null}
        {!isLoading && !plans.length ? <p className="text-ui-fg-subtle">No plans found.</p> : null}

        <div className="flex flex-col gap-3">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-md border border-ui-border-base p-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-medium">{plan.title}</h3>
                  <p className="text-ui-fg-subtle text-sm">
                    Price amount: {Number(plan.price_amount || 0)}
                  </p>
                  <p className="text-ui-fg-subtle text-sm">
                    {plan.duration_months} month(s) - {plan.discount_percentage}% discount
                  </p>
                  <p className="text-ui-fg-subtle text-sm">
                    Rank: {plan.rank} - Status: {plan.is_active ? "active" : "inactive"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editPlan(plan)}
                    className="rounded-md border border-ui-border-base px-3 py-1 text-sm"
                  >
                    Edit
                  </button>
                  {plan.is_active ? (
                    <button
                      type="button"
                      onClick={() => deactivatePlan(plan.id)}
                      className="rounded-md border border-red-300 text-red-700 px-3 py-1 text-sm"
                    >
                      Deactivate
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-ui-border-base p-4 bg-ui-bg-base">
        <h2 className="text-lg font-semibold mb-3">Subscribers</h2>
        {!subscribers.length ? (
          <p className="text-ui-fg-subtle">No subscriptions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-ui-border-base">
                  <th className="py-2 pr-3">Customer</th>
                  <th className="py-2 pr-3">Plan</th>
                  <th className="py-2 pr-3">Discount</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Remaining</th>
                  <th className="py-2 pr-3">Ends at</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-b border-ui-border-base">
                    <td className="py-2 pr-3">
                      <div className="flex flex-col">
                        <span>
                          {subscriber.customer?.first_name || ""} {subscriber.customer?.last_name || ""}
                        </span>
                        <span className="text-ui-fg-subtle">
                          {subscriber.customer?.email || subscriber.customer_id}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-3">{subscriber.plan_title}</td>
                    <td className="py-2 pr-3">{subscriber.discount_percentage}%</td>
                    <td className="py-2 pr-3">{subscriber.status}</td>
                    <td className="py-2 pr-3">{formatRemaining(subscriber)}</td>
                    <td className="py-2 pr-3">{formatDate(subscriber.ends_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {message ? <p className="text-ui-fg-subtle">{message}</p> : null}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Subscriptions",
})

export default SubscriptionsPage
