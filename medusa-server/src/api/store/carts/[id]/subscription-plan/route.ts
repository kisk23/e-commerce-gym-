import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import type { ICartModuleService, ICustomerModuleService } from "@medusajs/types"
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription"
import SubscriptionModuleService from "../../../../../modules/subscription/service"
import {
  applySubscriptionDiscountToCart,
  isSubscriptionPlanLineItem,
} from "../../../../../modules/subscription/utils/cart-discount"

type SelectSubscriptionPlanBody = {
  plan_id?: string
}

const toStringValue = (value: unknown) => {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
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

export async function POST(
  req: AuthenticatedMedusaRequest<SelectSubscriptionPlanBody>,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Customer must be authenticated")
  }

  const { id: cartId } = req.params
  const planId = toStringValue(req.body?.plan_id)

  if (!cartId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "cart id is required")
  }

  if (!planId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "plan_id is required")
  }

  const cartModuleService: ICartModuleService = req.scope.resolve(Modules.CART)
  const customerModuleService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)
  const subscriptionService: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)

  await subscriptionService.ensureDefaultPlans()

  const plan = await subscriptionService.retrieveSubscriptionPlan(planId)

  if (!plan || !plan.is_active) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Selected subscription plan is not active")
  }

  const cart = await cartModuleService.retrieveCart(cartId, {
    relations: ["items", "items.adjustments"],
  })

  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} wasn't found`)
  }

  if (cart.customer_id && cart.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "You can't update this cart")
  }

  if (!cart.customer_id) {
    await cartModuleService.updateCarts(cartId, { customer_id: customerId })
  }

  const existingSubscriptionItemIds = (cart.items || [])
    .filter((item) => isSubscriptionPlanLineItem((item.metadata || {}) as Record<string, unknown>))
    .map((item) => item.id)

  if (existingSubscriptionItemIds.length) {
    await cartModuleService.deleteLineItems(existingSubscriptionItemIds)
  }

  const planPriceAmount = Math.max(0, Math.round(toAmount(plan.price_amount)))

  await cartModuleService.addLineItems({
    cart_id: cartId,
    title: `Subscription: ${plan.title}`,
    quantity: 1,
    unit_price: planPriceAmount,
    is_custom_price: true,
    is_discountable: false,
    requires_shipping: false,
    metadata: {
      subscription_plan_purchase: true,
      subscription_plan_id: plan.id,
      subscription_plan_title: plan.title,
      subscription_plan_price_amount: planPriceAmount,
      subscription_plan_duration_months: Number(plan.duration_months || 0),
      subscription_plan_discount_percentage: Number(plan.discount_percentage || 0),
      subscription_plan_selected_at: new Date().toISOString(),
    },
  })

  const customer = await customerModuleService.retrieveCustomer(customerId)
  const currentCustomerMetadata = (customer.metadata || {}) as Record<string, unknown>
  const nowIso = new Date().toISOString()

  await customerModuleService.updateCustomers(customerId, {
    metadata: {
      ...currentCustomerMetadata,
      subscription_pending_plan_id: plan.id,
      subscription_pending_plan_title: plan.title,
      subscription_pending_plan_selected_at: nowIso,
      subscription_pending_cart_id: cartId,
    },
  })

  const currentCartMetadata = (cart.metadata || {}) as Record<string, unknown>
  await cartModuleService.updateCarts(cartId, {
    metadata: {
      ...currentCartMetadata,
      subscription_checkout_plan_id: plan.id,
      subscription_checkout_plan_title: plan.title,
      subscription_checkout_plan_price_amount: planPriceAmount,
      subscription_checkout_plan_duration_months: Number(plan.duration_months || 0),
      subscription_checkout_plan_discount_percentage: Number(plan.discount_percentage || 0),
      subscription_checkout_plan_selected_at: nowIso,
      subscription_intent_plan_id: null,
      subscription_intent_plan_title: null,
      subscription_intent_price_amount: null,
      subscription_intent_duration_months: null,
      subscription_intent_discount_percentage: null,
      subscription_intent_selected_at: null,
      subscription_activation_status: null,
      subscription_activation_processed_at: null,
      subscription_activation_action: null,
    },
  })

  const syncResult = await applySubscriptionDiscountToCart({
    cartId,
    customerId,
    cartModuleService,
    subscriptionService,
  })

  const updatedCart = await cartModuleService.retrieveCart(cartId, {
    relations: ["items", "items.adjustments"],
  })

  res.status(200).json({
    cart: updatedCart,
    plan,
    subscription: syncResult.activeSubscription
      ? {
          id: syncResult.activeSubscription.id,
          plan_title: syncResult.activeSubscription.plan_title,
          discount_percentage: syncResult.discountPercentage,
          ends_at: syncResult.activeSubscription.ends_at,
        }
      : null,
  })
}
