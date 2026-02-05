import { model } from "@medusajs/framework/utils"
import { BundleItem } from "./bundle-item"


export const Bundle = model.define("bundle", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().nullable(),
  discount_percentage: model.number(),
  is_active: model.boolean().default(true),
  items: model.hasMany(() => BundleItem, {
    mappedBy: "bundle",
  }),
})

