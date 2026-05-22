import { Modules } from "@medusajs/framework/utils"
import type { INotificationModuleService } from "@medusajs/types"

const DEFAULT_COUNTRY_CODE = "ae"

const firstCorsOrigin = () =>
  (process.env.STORE_CORS || "")
    .split(",")
    .map((origin) => origin.trim())
    .find((origin) => origin.startsWith("http"))

export const buildVerificationUrl = (token: string) => {
  const storefrontUrl =
    process.env.STOREFRONT_URL ||
    process.env.NEXT_PUBLIC_STOREFRONT_URL ||
    firstCorsOrigin() ||
    "http://localhost:8000"
  const countryCode =
    process.env.STOREFRONT_COUNTRY_CODE ||
    process.env.NEXT_PUBLIC_DEFAULT_REGION ||
    DEFAULT_COUNTRY_CODE

  const url = new URL(`/${countryCode}/verify-email`, storefrontUrl)
  url.searchParams.set("token", token)

  return url.toString()
}

export const sendVerificationEmail = async ({
  container,
  customerId,
  email,
  firstName,
  token,
}: {
  container: { resolve: <T = unknown>(key: string) => T }
  customerId: string
  email: string
  firstName?: string | null
  token: string
}) => {
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION)

  await notificationModuleService.createNotifications({
    to: email,
    channel: "email",
    template: "verify-email",
    data: {
      first_name: firstName || "",
      email,
      verification_url: buildVerificationUrl(token),
    },
    trigger_type: "customer.email_verification",
    resource_id: customerId,
    resource_type: "customer",
    receiver_id: customerId,
  })
}
