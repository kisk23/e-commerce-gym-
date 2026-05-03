import { model } from "@medusajs/framework/utils"
import { CustomerSubscription } from "./customer-subscription"

export const SubscriptionPlan = model.define("subscription_plan", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().nullable(),
  price_amount: model.number().default(0),
  duration_months: model.number(),
  discount_percentage: model.number(),
  rank: model.number().default(0),
  is_active: model.boolean().default(true),
  subscriptions: model.hasMany(() => CustomerSubscription, {
    mappedBy: "plan",
  }),
})
