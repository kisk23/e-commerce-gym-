import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription"
import SubscriptionModuleService from "../../../../../modules/subscription/service"
import {
  computeSubscriptionWindow,
  decorateRemainingTime,
  toStringValue,
} from "../../../../subscriptions/utils"
import { addMonths } from "../../../../../modules/subscription/utils/date"

type SubscribeBody = {
  plan_id?: string
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const subscriptionService: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Customer must be authenticated")
  }

  await subscriptionService.expireDueSubscriptions()

  const subscriptions = await subscriptionService.listCustomerSubscriptions(
    {
      customer_id: customerId,
    },
    {
      relations: ["plan"],
    }
  )

  const nowIso = new Date().toISOString()
  const mapped = subscriptions
    .map((subscription) => decorateRemainingTime(subscription, nowIso))
    .sort((a, b) => (b.ends_at || "").localeCompare(a.ends_at || ""))

  const active = mapped.find((subscription) => subscription.status === "active" && subscription.is_active)

  res.status(200).json({
    subscriptions: mapped,
    active_subscription: active || null,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<SubscribeBody>,
  res: MedusaResponse
) {
  const subscriptionService: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Customer must be authenticated")
  }

  const payload = req.body || {}
  const planId = toStringValue(payload.plan_id)

  if (!planId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "plan_id is required")
  }

  await subscriptionService.ensureDefaultPlans()
  await subscriptionService.expireDueSubscriptions()

  const plan = await subscriptionService.retrieveSubscriptionPlan(planId)

  if (!plan?.is_active) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Selected subscription plan is not active"
    )
  }

  const nowIso = new Date().toISOString()
  const active = await subscriptionService.getActiveSubscriptionForCustomer(customerId, nowIso)
  const durationMonths = Number(plan.duration_months || 0)
  const discountPercentage = Number(plan.discount_percentage || 0)

  if (active) {
    const updated = await subscriptionService.updateCustomerSubscriptions({
      id: active.id,
      plan_id: plan.id,
      plan_title: plan.title,
      duration_months: Number(active.duration_months || 0) + durationMonths,
      discount_percentage: discountPercentage,
      ends_at: addMonths(active.ends_at || nowIso, durationMonths),
      status: "active",
      cancelled_at: null,
    })

    const decorated = decorateRemainingTime(updated, nowIso)

    res.status(200).json({
      subscription: decorated,
      action: "extended",
    })
    return
  }

  const { starts_at, ends_at } = computeSubscriptionWindow(nowIso, durationMonths)
  const created = await subscriptionService.createCustomerSubscriptions({
    customer_id: customerId,
    plan_id: plan.id,
    plan_title: plan.title,
    duration_months: durationMonths,
    discount_percentage: discountPercentage,
    starts_at,
    ends_at,
    status: "active",
  })

  const decorated = decorateRemainingTime(created, nowIso)

  res.status(200).json({
    subscription: decorated,
    action: "created",
  })
}

