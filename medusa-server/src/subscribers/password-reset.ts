import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { INotificationModuleService } from "@medusajs/types"

type PasswordResetData = {
  actor_type?: string
  entity_id?: string
  token?: string
  metadata?: {
    redirect?: string
  }
}

const DEFAULT_COUNTRY_CODE = "ae"

const firstCorsOrigin = () =>
  (process.env.STORE_CORS || "")
    .split(",")
    .map((origin) => origin.trim())
    .find((origin) => origin.startsWith("http"))

const normalizeRedirectUrl = (redirectUrl?: string | null) => {
  const trimmed = redirectUrl?.trim()

  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null
  }

  return trimmed
}

const buildResetPasswordUrl = ({
  token,
  email,
  redirect,
}: {
  token: string
  email: string
  redirect?: string | null
}) => {
  const storefrontUrl =
    process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    firstCorsOrigin() ||
    "http://localhost:8000"
  const countryCode =
    process.env.STOREFRONT_COUNTRY_CODE ||
    process.env.NEXT_PUBLIC_DEFAULT_REGION ||
    DEFAULT_COUNTRY_CODE

  const url = new URL(`/${countryCode}/reset-password`, storefrontUrl)
  url.searchParams.set("token", token)
  url.searchParams.set("email", email)

  const normalizedRedirect = normalizeRedirectUrl(redirect)
  if (normalizedRedirect) {
    url.searchParams.set("redirect", normalizedRedirect)
  }

  return url.toString()
}

export default async function sendPasswordResetEmail({
  event,
  container,
}: SubscriberArgs<PasswordResetData>) {
  const { actor_type, entity_id: email, token, metadata } = event.data

  if (actor_type !== "customer" || !email || !token) {
    return
  }

  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION)

  await notificationModuleService.createNotifications({
    to: email,
    channel: "email",
    template: "reset-password",
    data: {
      email,
      reset_url: buildResetPasswordUrl({
        token,
        email,
        redirect: metadata?.redirect,
      }),
    },
    trigger_type: "auth.password_reset",
    resource_id: email,
    resource_type: "customer",
    receiver_id: null,
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
