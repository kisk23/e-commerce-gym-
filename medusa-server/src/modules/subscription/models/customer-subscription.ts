import { model } from "@medusajs/framework/utils"
import { SubscriptionPlan } from "./subscription-plan"

export const CustomerSubscription = model.define("customer_subscription", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  status: model.text(),
  plan_title: model.text(),
  duration_months: model.number(),
  discount_percentage: model.number(),
  pricing_segments: model.text(),
  starts_at: model.text(),
  ends_at: model.text(),
  cancelled_at: model.text().nullable(),
  plan: model.belongsTo(() => SubscriptionPlan, {
    mappedBy: "subscriptions",
  }),
})
