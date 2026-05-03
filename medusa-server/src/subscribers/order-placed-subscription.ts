import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IOrderModuleService } from "@medusajs/types"
import { SUBSCRIPTION_MODULE } from "../modules/subscription"
import SubscriptionModuleService from "../modules/subscription/service"

type OrderPlacedData = {
  id: string
}

const toStringValue = (value: unknown) => {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
}

const SUBSCRIPTION_METADATA_KEYS = {
  planId: "subscription_intent_plan_id",
  status: "subscription_activation_status",
  processedAt: "subscription_activation_processed_at",
  action: "subscription_activation_action",
}

export default async function activateSubscriptionOnOrder({
  event,
  container,
}: SubscriberArgs<OrderPlacedData>) {
  const orderId = event?.data?.id

  if (!orderId) {
    return
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  const subscriptionService: SubscriptionModuleService = container.resolve(SUBSCRIPTION_MODULE)

  const order = await orderModuleService.retrieveOrder(orderId, {
    relations: ["transactions"],
  })

  const customerId = order?.customer_id

  if (!customerId) {
    return
  }

  const orderMetadata = (order.metadata || {}) as Record<string, unknown>
  const selectedPlanId = toStringValue(orderMetadata[SUBSCRIPTION_METADATA_KEYS.planId])

  if (!selectedPlanId) {
    return
  }

  if (toStringValue(orderMetadata[SUBSCRIPTION_METADATA_KEYS.status]) === "applied") {
    return
  }

  const plan = await subscriptionService.retrieveSubscriptionPlan(selectedPlanId)

  if (!plan?.is_active) {
    logger.warn(
      `[subscriptions] Skipping activation for order ${orderId}: selected plan is missing or inactive`
    )
    return
  }

  const result = await subscriptionService.activatePlanForCustomer({
    customerId,
    plan: {
      id: plan.id,
      title: plan.title,
      duration_months: Number(plan.duration_months || 0),
      discount_percentage: Number(plan.discount_percentage || 0),
    },
  })

  await orderModuleService.updateOrders(orderId, {
    metadata: {
      ...orderMetadata,
      [SUBSCRIPTION_METADATA_KEYS.status]: "applied",
      [SUBSCRIPTION_METADATA_KEYS.processedAt]: new Date().toISOString(),
      [SUBSCRIPTION_METADATA_KEYS.action]: result.action,
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
