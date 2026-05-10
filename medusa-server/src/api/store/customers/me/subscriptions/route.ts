import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import type { IOrderModuleService } from "@medusajs/types"
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription"
import SubscriptionModuleService from "../../../../../modules/subscription/service"
import {
  decorateRemainingTime,
  toStringValue,
} from "../../../../subscriptions/utils"

type SubscribeBody = {
  plan_id?: string
}

const toAmount = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (value && typeof value === "object") {
    const withValue = value as { value?: unknown; raw?: unknown }
    return toAmount(withValue.value ?? withValue.raw)
  }

  return 0
}

const hasEligiblePaidOrder = async (
  orderService: IOrderModuleService,
  customerId: string
) => {
  const orders = await orderService.listOrders(
    { customer_id: customerId },
    {
      take: 50,
      relations: ["transactions"],
      order: { created_at: "DESC" },
    }
  )

  return orders.some((order) => {
    if (order.status !== "completed") {
      return false
    }

    const hasCapturedTransaction = (order.transactions || []).some((transaction) => {
      return (
        toAmount(transaction.amount) > 0 &&
        ["capture", "payment", "authorize"].includes(
          String(transaction.reference || "").toLowerCase()
        )
      )
    })

    return hasCapturedTransaction
  })
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
  const orderService: IOrderModuleService = req.scope.resolve(Modules.ORDER)
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Customer must be authenticated")
  }

  const allowDirectActivation =
    process.env.SUBSCRIPTIONS_ALLOW_DIRECT_ACTIVATION === "true"

  if (!allowDirectActivation) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Direct subscription activation is disabled. Complete checkout to activate your plan."
    )
  }

  const requirePaidOrder = process.env.SUBSCRIPTIONS_REQUIRE_PAID_ORDER === "true"
  const canSubscribe = requirePaidOrder
    ? await hasEligiblePaidOrder(orderService, customerId)
    : true

  if (!canSubscribe) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "You need at least one paid completed order before subscribing."
    )
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

  const result = await subscriptionService.activatePlanForCustomer({
    customerId,
    plan: {
      id: plan.id,
      title: plan.title,
      duration_months: Number(plan.duration_months || 0),
      discount_percentage: Number(plan.discount_percentage || 0),
      price_amount: Number(plan.price_amount || 0),
    },
  })
  const nowIso = new Date().toISOString()
  const decorated = decorateRemainingTime(result.subscription, nowIso)

  res.status(200).json({
    subscription: decorated,
    action: result.action,
  })
}
