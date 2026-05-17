import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import SubscriptionCompletedTemplate from "@modules/order/templates/subscription-completed-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}
export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

const isSubscriptionPlanOrder = (
  order: Awaited<ReturnType<typeof retrieveOrder>>
) => {
  return (order.items || []).some((item) => {
    const metadata = (item.metadata || {}) as Record<string, unknown>
    const rawFlag = metadata.subscription_plan_purchase
    return (
      rawFlag === true || rawFlag === "true" || rawFlag === 1 || rawFlag === "1"
    )
  })
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  if (isSubscriptionPlanOrder(order)) {
    return <SubscriptionCompletedTemplate order={order} />
  }

  return <OrderCompletedTemplate order={order} />
}
