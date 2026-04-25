"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag } from "./cookies"
import { StoreCustomerSubscription, StoreSubscriptionPlan } from "@lib/types/subscription"

export const listSubscriptionPlans = async (): Promise<StoreSubscriptionPlan[]> => {
  return sdk.client
    .fetch<{ plans: StoreSubscriptionPlan[] }>("/store/subscriptions/plans", {
      method: "GET",
      cache: "no-store",
    })
    .then((response) => response.plans || [])
    .catch(() => [])
}

export const listMySubscriptions = async (): Promise<{
  subscriptions: StoreCustomerSubscription[]
  active_subscription: StoreCustomerSubscription | null
}> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
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
    .catch(() => ({
      subscriptions: [],
      active_subscription: null,
    }))
}

export const subscribeToPlan = async (planId: string) => {
  if (!planId) {
    throw new Error("Missing subscription plan ID")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const result = await sdk.client
    .fetch<{
      subscription: StoreCustomerSubscription
      action: "created" | "extended"
    }>("/store/customers/me/subscriptions", {
      method: "POST",
      body: {
        plan_id: planId,
      },
      headers,
    })
    .catch(medusaError)

  const customerTag = await getCacheTag("customers")
  revalidateTag(customerTag)

  const cartTag = await getCacheTag("carts")
  revalidateTag(cartTag)

  return result
}

