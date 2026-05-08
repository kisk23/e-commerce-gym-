import { MedusaService } from "@medusajs/framework/utils"
import { SubscriptionPlan } from "./models/subscription-plan"
import { CustomerSubscription } from "./models/customer-subscription"
import { addMonths, isPast, toValidDate } from "./utils/date"

const DEFAULT_PLANS = [
  {
    title: "Monthly",
    description: "Pay monthly with no long-term commitment.",
    price_amount: 20,
    duration_months: 1,
    discount_percentage: 0,
    rank: 1,
    is_active: true,
  },
  {
    title: "Quarterly",
    description: "Prepaid subscription for 3 months.",
    price_amount: 60,
    duration_months: 3,
    discount_percentage: 5,
    rank: 2,
    is_active: true,
  },
  {
    title: "Semi-Annual",
    description: "Prepaid subscription for 6 months.",
    price_amount: 120,
    duration_months: 6,
    discount_percentage: 10,
    rank: 3,
    is_active: true,
  },
  {
    title: "Annual",
    description: "Prepaid subscription for 12 months.",
    price_amount: 240,
    duration_months: 12,
    discount_percentage: 18,
    rank: 4,
    is_active: true,
  },
]

class SubscriptionModuleService extends MedusaService({
  SubscriptionPlan,
  CustomerSubscription,
}) {
  async ensureDefaultPlans() {
    const existingPlans = await this.listSubscriptionPlans({})
    const existingByDuration = new Set(existingPlans.map((plan) => Number(plan.duration_months)))
    const missingPlans = DEFAULT_PLANS.filter(
      (plan) => !existingByDuration.has(Number(plan.duration_months))
    )

    if (!missingPlans.length) {
      return existingPlans
    }

    for (const plan of missingPlans) {
      await this.createSubscriptionPlans(plan)
    }

    return this.listSubscriptionPlans({})
  }

  async expireDueSubscriptions(nowIso = new Date().toISOString()) {
    const activeSubscriptions = await this.listCustomerSubscriptions({
      status: "active",
    })

    const expiredIds = activeSubscriptions
      .filter((subscription) => isPast(subscription.ends_at, nowIso))
      .map((subscription) => subscription.id)

    if (!expiredIds.length) {
      return []
    }

    await Promise.all(
      expiredIds.map((id) =>
        this.updateCustomerSubscriptions({
          id,
          status: "expired",
        })
      )
    )

    return expiredIds
  }

  async getActiveSubscriptionForCustomer(customerId: string, nowIso = new Date().toISOString()) {
    const subscriptions = await this.listCustomerSubscriptions({
      customer_id: customerId,
      status: "active",
    })

    if (!subscriptions.length) {
      return null
    }

    const sorted = subscriptions.sort((a, b) => {
      const aDate = toValidDate(a.ends_at)?.getTime() || 0
      const bDate = toValidDate(b.ends_at)?.getTime() || 0
      return bDate - aDate
    })

    const active = sorted.find((subscription) => !isPast(subscription.ends_at, nowIso))

    if (!active) {
      await Promise.all(
        sorted.map((subscription) =>
          this.updateCustomerSubscriptions({
            id: subscription.id,
            status: "expired",
          })
        )
      )
      return null
    }

    return active
  }

  async activatePlanForCustomer({
    customerId,
    plan,
    nowIso = new Date().toISOString(),
  }: {
    customerId: string
    plan: {
      id: string
      title: string
      duration_months: number
      discount_percentage: number
    }
    nowIso?: string
  }) {
    const active = await this.getActiveSubscriptionForCustomer(customerId, nowIso)
    const durationMonths = Number(plan.duration_months || 0)
    const discountPercentage = Number(plan.discount_percentage || 0)

    if (active) {
      const updated = await this.updateCustomerSubscriptions({
        id: active.id,
        plan_id: plan.id,
        plan_title: plan.title,
        duration_months: Number(active.duration_months || 0) + durationMonths,
        discount_percentage: discountPercentage,
        ends_at: addMonths(active.ends_at || nowIso, durationMonths),
        status: "active",
        cancelled_at: null,
      })

      return {
        subscription: updated,
        action: "extended" as const,
      }
    }

    const created = await this.createCustomerSubscriptions({
      customer_id: customerId,
      plan_id: plan.id,
      plan_title: plan.title,
      duration_months: durationMonths,
      discount_percentage: discountPercentage,
      starts_at: nowIso,
      ends_at: addMonths(nowIso, durationMonths),
      status: "active",
    })

    return {
      subscription: created,
      action: "created" as const,
    }
  }
}

export default SubscriptionModuleService
