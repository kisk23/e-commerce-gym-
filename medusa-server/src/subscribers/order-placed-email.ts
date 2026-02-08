import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { INotificationModuleService, IOrderModuleService } from "@medusajs/types"

type OrderPlacedData = {
  id: string
}

export default async function sendOrderPlacedEmail({
  event,
  container,
}: SubscriberArgs<OrderPlacedData>) {
  const orderId = event?.data?.id

  if (!orderId) {
    return
  }

  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  const notificationModuleService: INotificationModuleService = container.resolve(
    Modules.NOTIFICATION
  )

  const order = await orderModuleService.retrieveOrder(orderId)

  if (!order?.email) {
    return
  }

  const forcedRecipient = process.env.ORDER_EMAIL_TEST_RECIPIENT?.trim()
  const recipient = forcedRecipient || order.email

  await notificationModuleService.createNotifications({
    to: recipient,
    channel: "email",
    template: "order-placed",
    data: {
      order_id: order.id,
      display_id: order.display_id,
      total: order.total,
      currency_code: order.currency_code,
      email: recipient,
      original_email: order.email,
    },
    trigger_type: "order.placed",
    resource_id: order.id,
    resource_type: "order",
    receiver_id: order.customer_id ?? null,
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
