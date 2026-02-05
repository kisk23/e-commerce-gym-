"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag } from "./cookies"
import { getOrSetCart } from "./cart"
import { StoreBundle } from "@lib/types/bundle"

export async function listBundles(): Promise<StoreBundle[]> {
  return sdk.client
    .fetch<{ bundles: StoreBundle[] }>("/store/bundles", {
      method: "GET",
      cache: "no-store",
    })
    .then((response) => response.bundles || [])
    .catch((error) => {
      console.error("[bundles] Failed to fetch /store/bundles", error)
      return []
    })
}

export async function addBundleToCart({
  bundleId,
  countryCode,
}: {
  bundleId: string
  countryCode: string
}) {
  if (!bundleId) {
    throw new Error("Missing bundle ID when adding bundle to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.client
    .fetch(`/store/carts/${cart.id}/line-item-bundles`, {
      method: "POST",
      body: {
        bundle_id: bundleId,
      },
      headers,
    })
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}
