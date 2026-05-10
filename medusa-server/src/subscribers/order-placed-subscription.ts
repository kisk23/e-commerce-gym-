import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type {
  ICartModuleService,
  ICustomerModuleService,
  IOrderModuleService,
} from "@medusajs/types"
import { SUBSCRIPTION_MODULE } from "../modules/subscription"
import SubscriptionModuleService from "../modules/subscription/service"
import {
  applySubscriptionDiscountToCart,
  isSubscriptionPlanLineItem,
} from "../modules/subscription/utils/cart-discount"

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
  planId: "subscription_plan_id",
  status: "subscription_activation_status",
  processedAt: "subscription_activation_processed_at",
  action: "subscription_activation_action",
  effectiveDiscount: "subscription_effective_discount_percentage",
  pricingSegments: "subscription_pricing_segments",
}

const CUSTOMER_PENDING_METADATA_KEYS = {
  planId: "subscription_pending_plan_id",
  planTitle: "subscription_pending_plan_title",
  selectedAt: "subscription_pending_plan_selected_at",
  cartId: "subscription_pending_cart_id",
}

const readSelectedPlanIdFromOrderItems = (items: unknown[]) => {
  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue
    }

    const itemWithMetadata = item as { metadata?: Record<string, unknown> }
    const metadata = (itemWithMetadata.metadata || {}) as Record<string, unknown>

    if (!isSubscriptionPlanLineItem(metadata)) {
      continue
    }

    const planId = toStringValue(metadata.subscription_plan_id)

    if (planId) {
      return planId
    }
  }

  return ""
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
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)
  const cartModuleService: ICartModuleService = container.resolve(Modules.CART)
  const subscriptionService: SubscriptionModuleService = container.resolve(SUBSCRIPTION_MODULE)

  const order = await orderModuleService.retrieveOrder(orderId, {
    relations: ["transactions", "items"],
  })

  const customerId = order?.customer_id

  if (!customerId) {
    return
  }

  const customer = await customerModuleService.retrieveCustomer(customerId)
  const orderMetadata = (order.metadata || {}) as Record<string, unknown>
  const customerMetadata = (customer.metadata || {}) as Record<string, unknown>
  const orderItems = Array.isArray(order.items) ? order.items : []
  const selectedPlanId =
    readSelectedPlanIdFromOrderItems(orderItems) ||
    toStringValue(orderMetadata[SUBSCRIPTION_METADATA_KEYS.planId]) ||
    toStringValue(customerMetadata[CUSTOMER_PENDING_METADATA_KEYS.planId])

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
      price_amount: Number(plan.price_amount || 0),
    },
  })

  await orderModuleService.updateOrders(orderId, {
    metadata: {
      ...orderMetadata,
      [SUBSCRIPTION_METADATA_KEYS.planId]: plan.id,
      [SUBSCRIPTION_METADATA_KEYS.status]: "applied",
      [SUBSCRIPTION_METADATA_KEYS.processedAt]: new Date().toISOString(),
      [SUBSCRIPTION_METADATA_KEYS.action]: result.action,
      [SUBSCRIPTION_METADATA_KEYS.effectiveDiscount]: Number(
        result.subscription?.discount_percentage || 0
      ),
      [SUBSCRIPTION_METADATA_KEYS.pricingSegments]:
        result.subscription?.pricing_segments || "[]",
    },
  })

  await customerModuleService.updateCustomers(customerId, {
    metadata: {
      ...customerMetadata,
      [CUSTOMER_PENDING_METADATA_KEYS.planId]: null,
      [CUSTOMER_PENDING_METADATA_KEYS.planTitle]: null,
      [CUSTOMER_PENDING_METADATA_KEYS.selectedAt]: null,
      [CUSTOMER_PENDING_METADATA_KEYS.cartId]: null,
    },
  })

  // Ensure the newly activated plan discount is reflected on all open carts
  // for this customer without waiting for the next cart mutation.
  const customerCarts = await cartModuleService.listCarts({
    customer_id: customerId,
  })

  const openCartIds = customerCarts
    .filter((cart) => !cart.completed_at)
    .map((cart) => cart.id)

  await Promise.all(
    openCartIds.map((cartId) =>
      applySubscriptionDiscountToCart({
        cartId,
        customerId,
        cartModuleService,
        subscriptionService,
      }).catch((error) => {
        logger.warn(
          `[subscriptions] Could not sync subscription discount for cart ${cartId}: ${
            error instanceof Error ? error.message : "unknown error"
          }`
        )
      })
    )
  )
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
