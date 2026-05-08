"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag } from "./cookies"
import { getOrSetCart, syncSubscriptionDiscount, clearCart } from "./cart"
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

  // Clear any existing items from the cart before adding subscription plan
  await clearCart(cart.id)

  await sdk.client
    .fetch(`/store/carts/${cart.id}/subscription-plan`, {
      method: "POST",
      headers: authHeaders,
      body: {
        plan_id: selectedPlan.id,
      },
      cache: "no-store",
    })
    .catch((err) => medusaError(err))

  await syncSubscriptionDiscount(cart.id)

  const customerTag = await getCacheTag("customers")
  revalidateTag(customerTag)

  const checkoutCountryCode = countryCode.toLowerCase()
  redirect(`/${checkoutCountryCode}/subscription-checkout?step=payment`)
}
