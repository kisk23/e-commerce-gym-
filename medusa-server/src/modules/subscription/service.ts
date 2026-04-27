import { MedusaService } from "@medusajs/framework/utils"
import { SubscriptionPlan } from "./models/subscription-plan"
import { CustomerSubscription } from "./models/customer-subscription"
import { isPast, toValidDate } from "./utils/date"

const DEFAULT_PLANS = [
  {
    title: "3 Months Prepaid",
    description: "Prepaid subscription for 3 months.",
    duration_months: 3,
    discount_percentage: 5,
    rank: 1,
    is_active: true,
  },
  {
    title: "6 Months Prepaid",
    description: "Prepaid subscription for 6 months.",
    duration_months: 6,
    discount_percentage: 10,
    rank: 2,
    is_active: true,
  },
  {
    title: "9 Months Prepaid",
    description: "Prepaid subscription for 9 months.",
    duration_months: 9,
    discount_percentage: 15,
    rank: 3,
    is_active: true,
  },
  {
    title: "1 Year Prepaid",
    description: "Prepaid subscription for 12 months.",
    duration_months: 12,
    discount_percentage: 20,
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

    await Promise.all(
      missingPlans.map((plan) => {
        return this.createSubscriptionPlans(plan)
      })
    )

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
}

export default SubscriptionModuleService
