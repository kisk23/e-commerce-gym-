import { model } from "@medusajs/framework/utils"
import { BundleItem } from "./bundle-item"


export const Bundle = model.define("bundle", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().nullable(),
  bundle_type: model.text().nullable(),
  discount_percentage: model.number(),
  is_active: model.boolean().default(true),
  total_weight: model.number().default(0),
  total_calories: model.number().default(0),
  total_protein: model.number().default(0),
  total_carbs: model.number().default(0),
  total_fat: model.number().default(0),
  total_price: model.number().default(0),
  items: model.hasMany(() => BundleItem, {
    mappedBy: "bundle",
  }),
})

