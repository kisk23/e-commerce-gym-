"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag } from "./cookies"
import { getOrSetCart, retrieveCart, updateCart } from "./cart"
import { redirect } from "next/navigation"
import {
  StoreCustomerSubscription,
  StoreSubscriptionPlan,
} from "@lib/types/subscription"

export const listSubscriptionPlans = async (): Promise<
  StoreSubscriptionPlan[]
> => {
  return await sdk.client
    .fetch<{ plans: StoreSubscriptionPlan[] }>("/store/subscriptions/plans", {
      method: "GET",
      cache: "no-store",
    })
    .then((response) => response.plans || [])
    .catch((err) => medusaError(err))
}

export const listMySubscriptions = async (): Promise<{
  subscriptions: StoreCustomerSubscription[]
  active_subscription: StoreCustomerSubscription | null
}> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return await sdk.client
    .fetch<{
      subscriptions: StoreCustomerSubscription[]
      active_subscription: StoreCustomerSubscription | null
    }>("/store/customers/me/subscriptions", {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then((response) => ({
      subscriptions: response.subscriptions || [],
      active_subscription: response.active_subscription || null,
    }))
    .catch((err) => medusaError(err))
}

export const subscribeToPlan = async (planId: string, countryCode: string) => {
  if (!planId) {
    throw new Error("Missing subscription plan ID")
  }

  if (!countryCode) {
    throw new Error("Missing country code")
  }

  const authHeaders = await getAuthHeaders()

  if (!("authorization" in authHeaders)) {
    throw new Error("Please sign in to subscribe.")
  }

  const plans = await listSubscriptionPlans()
  const selectedPlan = plans.find((plan) => plan.id === planId && plan.is_active)

  if (!selectedPlan) {
    throw new Error("Selected subscription plan is not available.")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart?.id) {
    throw new Error("Could not initialize cart for subscription checkout.")
  }

  const cartSnapshot = await retrieveCart(cart.id, "id,metadata")
  const currentMetadata = (cartSnapshot?.metadata || {}) as Record<string, unknown>
  const nowIso = new Date().toISOString()

  await updateCart({
    metadata: {
      ...currentMetadata,
      subscription_intent_plan_id: selectedPlan.id,
      subscription_intent_plan_title: selectedPlan.title,
      subscription_intent_price_amount: selectedPlan.price_amount,
      subscription_intent_duration_months: selectedPlan.duration_months,
      subscription_intent_discount_percentage: selectedPlan.discount_percentage,
      subscription_intent_selected_at: nowIso,
      subscription_activation_status: "pending_checkout",
      subscription_activation_processed_at: null,
      subscription_activation_action: null,
    },
  })

  const customerTag = await getCacheTag("customers")
  revalidateTag(customerTag)

  const checkoutCountryCode = countryCode.toLowerCase()
  redirect(`/${checkoutCountryCode}/checkout?step=payment`)
}
