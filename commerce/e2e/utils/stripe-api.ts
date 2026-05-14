import type { APIRequestContext } from "@playwright/test"
import { e2eEnv } from "./env"

const zeroDecimalCurrencies = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
])

export function paymentIntentIdFromSecret(clientSecret?: string) {
  if (!clientSecret) {
    return ""
  }

  return clientSecret.split("_secret_")[0]
}

export function toStripeAmount(amount: number, currencyCode?: string | null) {
  const currency = (currencyCode || "").toLowerCase()
  return zeroDecimalCurrencies.has(currency) ? Math.round(amount) : Math.round(amount * 100)
}

export async function retrievePaymentIntent(
  request: APIRequestContext,
  clientSecret?: string
) {
  if (!e2eEnv.stripeApiKey) {
    return null
  }

  const paymentIntentId = paymentIntentIdFromSecret(clientSecret)

  if (!paymentIntentId) {
    return null
  }

  const response = await request.get(
    `https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
    {
      headers: {
        Authorization: `Bearer ${e2eEnv.stripeApiKey}`,
      },
    }
  )

  if (!response.ok()) {
    throw new Error(
      `Could not retrieve Stripe PaymentIntent ${paymentIntentId}: ${response.status()} ${await response.text()}`
    )
  }

  return response.json()
}
