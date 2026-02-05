import { model } from "@medusajs/framework/utils"


export const Bundle = model.define("bundle", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text(),
  discount: model.number(),
  discount_percent: model.number(),
  goal: model.text(),
  items: model.hasMany("bundle_item"),
})

