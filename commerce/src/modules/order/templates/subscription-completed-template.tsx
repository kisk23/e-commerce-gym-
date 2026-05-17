import { Button, Heading, Text } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Divider from "@modules/common/components/divider"
import Help from "@modules/order/components/help"
import PaymentDetails from "@modules/order/components/payment-details"
import CartRestorer from "@modules/order/components/cart-restorer"

type SubscriptionCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

const isTruthyMetadataValue = (value: unknown) =>
  value === true || value === "true" || value === 1 || value === "1"

const getSubscriptionItemMetadata = (order: HttpTypes.StoreOrder) => {
  const subscriptionItem = (order.items || []).find((item) => {
    const metadata = (item.metadata || {}) as Record<string, unknown>
    return isTruthyMetadataValue(metadata.subscription_plan_purchase)
  })

  return (subscriptionItem?.metadata || {}) as Record<string, unknown>
}

const toDisplayValue = (value: unknown, fallback = "-") => {
  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  return fallback
}

const toDurationText = (value: unknown) => {
  const normalized = toDisplayValue(value)

  if (normalized === "-") {
    return normalized
  }

  return `${normalized} month${normalized === "1" ? "" : "s"}`
}

const toDiscountText = (value: unknown) => {
  const normalized = toDisplayValue(value)

  if (normalized === "-") {
    return normalized
  }

  return `${normalized}%`
}

export default function SubscriptionCompletedTemplate({
  order,
}: SubscriptionCompletedTemplateProps) {
  const metadata = getSubscriptionItemMetadata(order)
  const planTitle = toDisplayValue(metadata.subscription_plan_title, "Plan")
  const durationText = toDurationText(
    metadata.subscription_plan_duration_months
  )
  const discountText = toDiscountText(
    metadata.subscription_plan_discount_percentage
  )

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <CartRestorer />
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        <div
          className="flex flex-col gap-6 max-w-4xl h-full bg-white w-full py-10"
          data-testid="subscription-complete-container"
        >
          <Heading
            level="h1"
            className="flex flex-col gap-y-3 text-ui-fg-base text-3xl"
          >
            <span>Subscription confirmed!</span>
            <span>Your plan purchase was completed successfully.</span>
          </Heading>

          <div>
            <Text>
              We have sent the subscription confirmation details to{" "}
              <span
                className="text-ui-fg-medium-plus font-semibold"
                data-testid="subscription-email"
              >
                {order.email}
              </span>
              .
            </Text>
            <Text className="mt-2">
              Order date:{" "}
              <span data-testid="subscription-order-date">
                {new Date(order.created_at).toDateString()}
              </span>
            </Text>
            <Text className="mt-2 text-ui-fg-interactive">
              Order number:{" "}
              <span data-testid="subscription-order-id">
                {order.display_id}
              </span>
            </Text>
          </div>

          <section className="rounded-lg border border-ui-border-base p-4">
            <Heading level="h2" className="text-xl mb-4">
              Plan summary
            </Heading>
            <div className="grid grid-cols-1 small:grid-cols-3 gap-4">
              <div>
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Plan
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="subscription-plan-title"
                >
                  {planTitle}
                </Text>
              </div>
              <div>
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Duration
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="subscription-plan-duration"
                >
                  {durationText}
                </Text>
              </div>
              <div>
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Discount
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="subscription-plan-discount"
                >
                  {discountText}
                </Text>
              </div>
            </div>
          </section>

          <PaymentDetails order={order} />

          <div>
            <LocalizedClientLink href="/subscriptions">
              <Button className="h-10 rounded-md">Manage subscription</Button>
            </LocalizedClientLink>
          </div>

          <Divider />
          <Help />
        </div>
      </div>
    </div>
  )
}
