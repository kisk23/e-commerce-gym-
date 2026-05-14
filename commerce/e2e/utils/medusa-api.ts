import type { APIRequestContext, BrowserContext } from "@playwright/test"
import { e2eEnv } from "./env"

const storeHeaders = () => ({
  "x-publishable-api-key": e2eEnv.publishableKey,
})

export async function getCartIdFromCookies(context: BrowserContext) {
  const cookies = await context.cookies()
  return cookies.find((cookie) => cookie.name === "_medusa_cart_id")?.value || ""
}

export async function retrieveCart(
  request: APIRequestContext,
  cartId: string,
  fields =
    "*items,*items.metadata,*items.adjustments,*region,*shipping_methods,*payment_collection,*payment_collection.payment_sessions"
) {
  const params = new URLSearchParams({ fields })
  const response = await request.get(
    `${e2eEnv.backendUrl}/store/carts/${cartId}?${params.toString()}`,
    {
      headers: storeHeaders(),
    }
  )

  if (!response.ok()) {
    throw new Error(
      `Could not retrieve cart ${cartId}: ${response.status()} ${await response.text()}`
    )
  }

  const body = await response.json()
  return body.cart
}

export async function updateCart(
  request: APIRequestContext,
  cartId: string,
  body: Record<string, unknown>
) {
  const response = await request.post(`${e2eEnv.backendUrl}/store/carts/${cartId}`, {
    headers: storeHeaders(),
    data: body,
  })

  if (!response.ok()) {
    throw new Error(
      `Could not update cart ${cartId}: ${response.status()} ${await response.text()}`
    )
  }

  return (await response.json()).cart
}

export async function listShippingOptions(
  request: APIRequestContext,
  cartId: string
) {
  const params = new URLSearchParams({ cart_id: cartId })
  const response = await request.get(
    `${e2eEnv.backendUrl}/store/shipping-options?${params.toString()}`,
    {
      headers: storeHeaders(),
    }
  )

  if (!response.ok()) {
    throw new Error(
      `Could not list shipping options: ${response.status()} ${await response.text()}`
    )
  }

  return (await response.json()).shipping_options || []
}

export async function addShippingMethod(
  request: APIRequestContext,
  cartId: string,
  optionId: string
) {
  const response = await request.post(
    `${e2eEnv.backendUrl}/store/carts/${cartId}/shipping-methods`,
    {
      headers: storeHeaders(),
      data: {
        option_id: optionId,
      },
    }
  )

  if (!response.ok()) {
    throw new Error(
      `Could not add shipping method ${optionId}: ${response.status()} ${await response.text()}`
    )
  }

  return (await response.json()).cart
}

export async function listPaymentProviders(
  request: APIRequestContext,
  regionId: string
) {
  const params = new URLSearchParams({ region_id: regionId })
  const response = await request.get(
    `${e2eEnv.backendUrl}/store/payment-providers?${params.toString()}`,
    {
      headers: storeHeaders(),
    }
  )

  if (!response.ok()) {
    throw new Error(
      `Could not list payment providers: ${response.status()} ${await response.text()}`
    )
  }

  return (await response.json()).payment_providers || []
}

export async function initiatePaymentSession(
  request: APIRequestContext,
  cart: any,
  providerId: string
) {
  let paymentCollectionId = cart.payment_collection?.id

  if (!paymentCollectionId) {
    const collectionResponse = await request.post(
      `${e2eEnv.backendUrl}/store/payment-collections`,
      {
        headers: storeHeaders(),
        data: {
          cart_id: cart.id,
        },
      }
    )

    if (!collectionResponse.ok()) {
      throw new Error(
        `Could not create payment collection: ${collectionResponse.status()} ${await collectionResponse.text()}`
      )
    }

    paymentCollectionId = (await collectionResponse.json()).payment_collection.id
  }

  const sessionResponse = await request.post(
    `${e2eEnv.backendUrl}/store/payment-collections/${paymentCollectionId}/payment-sessions`,
    {
      headers: storeHeaders(),
      data: {
        provider_id: providerId,
      },
    }
  )

  if (!sessionResponse.ok()) {
    throw new Error(
      `Could not initiate payment session: ${sessionResponse.status()} ${await sessionResponse.text()}`
    )
  }

  return (await sessionResponse.json()).payment_collection
}

export async function listBundles(request: APIRequestContext) {
  const response = await request.get(`${e2eEnv.backendUrl}/store/bundles`, {
    headers: storeHeaders(),
  })

  if (!response.ok()) {
    throw new Error(
      `Could not list bundles: ${response.status()} ${await response.text()}`
    )
  }

  const body = await response.json()
  return body.bundles || []
}

export async function findBundleForE2E(request: APIRequestContext) {
  const bundles = await listBundles(request)
  const selected = e2eEnv.bundleId
    ? bundles.find((bundle: any) => bundle.id === e2eEnv.bundleId)
    : bundles.find((bundle: any) => bundle.is_active !== false && bundle.items?.length)

  if (!selected) {
    throw new Error(
      e2eEnv.bundleId
        ? `E2E_BUNDLE_ID=${e2eEnv.bundleId} was not found in /store/bundles`
        : "No active bundle with items was found in /store/bundles"
    )
  }

  return selected
}

export function paymentIntentClientSecret(cart: any) {
  return cart.payment_collection?.payment_sessions?.find((session: any) =>
    String(session.provider_id || "").includes("stripe")
  )?.data?.client_secret
}
