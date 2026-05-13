import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type {
  INotificationModuleService,
  IOrderModuleService
} from "@medusajs/types"
import { isSubscriptionPlanLineItem } from "../modules/subscription/utils/cart-discount"

type OrderPlacedData = {
  id: string
}

const DEFAULT_ADMIN_EMAIL = "info@elvardubai.com"

const parseEmailList = (value?: string | null) =>
  (value || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)

const getAdminRecipients = () => {
  const configuredRecipients = parseEmailList(
    process.env.ORDER_ADMIN_EMAILS || process.env.ADMIN_ORDER_EMAILS
  )

  if (configuredRecipients.length) {
    return configuredRecipients
  }

  const testRecipient = process.env.ORDER_EMAIL_TEST_RECIPIENT?.trim()
  return [testRecipient || DEFAULT_ADMIN_EMAIL]
}

const toEmailItems = (items: any[] = []) =>
  items.map((item) => ({
    title: item.title || item.product_title || "Item",
    product_title: item.product_title || item.title || "Item",
    variant_title: item.variant_title || null,
    quantity: item.quantity || 0,
    unit_price: item.unit_price || 0,
    total:
      item.total ?? Number(item.unit_price || 0) * Number(item.quantity || 0)
  }))

const isSubscriptionOnlyOrder = (items: unknown[]) => {
  if (!items.length) {
    return false
  }

  return items.every((item) => {
    if (!item || typeof item !== "object") {
      return false
    }

    const metadata = ((item as { metadata?: Record<string, unknown> })
      .metadata || {}) as Record<string, unknown>

    return isSubscriptionPlanLineItem(metadata)
  })
}

export default async function sendOrderPlacedEmail({
  event,
  container
}: SubscriberArgs<OrderPlacedData>) {
  const orderId = event?.data?.id

  if (!orderId) {
    return
  }

  const orderModuleService: IOrderModuleService = container.resolve(
    Modules.ORDER
  )
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION)

  const order = await orderModuleService.retrieveOrder(orderId, {
    relations: ["items", "shipping_address"]
  })

  if (!order?.email) {
    return
  }

  const orderItems = Array.isArray(order.items) ? order.items : []

  if (isSubscriptionOnlyOrder(orderItems)) {
    return
  }

  const forcedRecipient = process.env.ORDER_EMAIL_TEST_RECIPIENT?.trim()
  const recipient = forcedRecipient || order.email
  const emailData = {
    order_id: order.id,
    display_id: order.display_id,
    total: order.total,
    currency_code: order.currency_code,
    email: recipient,
    original_email: order.email,
    items: toEmailItems(orderItems),
    shipping_address: (order as any).shipping_address || null
  }

  await notificationModuleService.createNotifications([
    {
      to: recipient,
      channel: "email",
      template: "order-placed",
      data: emailData,
      trigger_type: "order.placed",
      resource_id: order.id,
      resource_type: "order",
      receiver_id: order.customer_id ?? null
    },
    ...getAdminRecipients().map((adminEmail) => ({
      to: adminEmail,
      channel: "email",
      template: "new-order",
      data: emailData,
      trigger_type: "order.placed",
      resource_id: order.id,
      resource_type: "order",
      receiver_id: null
    }))
  ])
}

export const config: SubscriberConfig = {
  event: "order.placed"
}
