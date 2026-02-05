import { model } from "@medusajs/framework/utils"
import { Bundle } from "./bundle"

export const BundleItem = model.define("bundle_item", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  product_title: model.text(),
  variant_id: model.text(),
  variant_title: model.text(),
  thumbnail: model.text().nullable(),
  quantity: model.number().default(1),
  bundle: model.belongsTo(() => Bundle, {
    mappedBy: "items",
  }),
})
