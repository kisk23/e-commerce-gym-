import { model } from "@medusajs/framework/utils"
import { Bundle } from "./bundle"

//there is no relationship between bundle item and product/variant in the bundled products recipe, but you could add product/variant ids as text fields here if you wanted to link them via a custom link or just query them manually in your service it works just fine and doesn't violate any DML or module isolation rules, but it's not how the official recipe is set up so I can't confirm it as "correct" per se since it's not documented in the recipe. The important part is that you have the `belongsTo` relationship to `Bundle` set up correctly, which you do.
export const BundleItem = model.define("bundle_item", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  product_title: model.text(),
  variant_id: model.text(),
  variant_title: model.text(),
  thumbnail: model.text().nullable(),
  quantity: model.number().default(1),
  weight: model.number().default(0),
  calories: model.number().default(0),
  protein: model.number().default(0),
  carbs: model.number().default(0),
  fat: model.number().default(0),
  bundle: model.belongsTo(() => Bundle, {
    mappedBy: "items",
  }),
})



//docs snippet

// src/modules/bundled-product/models/bundle-item.ts
// import { model } from "@medusajs/framework/utils"
// import { Bundle } from "./bundle"

// export const BundleItem = model.define("bundle_item", {
//   id: model.id().primaryKey(),
//   quantity: model.number().default(1),
//   bundle: model.belongsTo(() => Bundle, {
//     mappedBy: "items",
//   }),


// src/links/bundle-item-product.ts
// import { defineLink } from "@medusajs/framework/utils"
// import ProductModule from "@medusajs/medusa/product"
// import BundledProductsModule from "../modules/bundled-product"

// export default defineLink(
//   { linkable: BundledProductsModule.linkable.bundleItem, isList: true },
//   ProductModule.linkable.product
// )
// ``` [[Links step](https://docs.medusajs.com/resources/recipes/bundled-products/examples/standard#step-3-link-bundles-to-medusa-products)]

// Key issues with your snippet relative to the docs:

// 1. **Direct `belongsTo` to Product/Variant**  
//    - Medusa’s module isolation rules say you should not create direct relationships between models in different modules; instead, use **module links**. [[Relationships](https://docs.medusajs.com/learn/fundamentals/data-models/relationships); [Module links](https://docs.medusajs.com/resources/recipes/bundled-products/examples/standard#step-3-link-bundles-to-medusa-products)]

// 2. **Importing Product / ProductVariant**  
//    - The docs only show importing the Product module as `ProductModule` to access `ProductModule.linkable.product` for links; they do **not** show using `Product` or `ProductVariant` as DML models in your own module. [[Links step](https://docs.medusajs.com/resources/recipes/bundled-products/examples/standard#step-3-link-bundles-to-medusa-products)]

// 3. **Extra fields (product_id, titles, macros, etc.)**  
//    - The docs don’t cover adding these extra properties, so there’s no explicit guidance on whether this exact shape is valid. Medusa’s DML does support `text`, `number`, `nullable`, etc., so the property *types* are fine, but the official recipe doesn’t show or validate this particular schema. [[Data models](https://docs.medusajs.com/resources/examples#data-models)]

// So:

// - Using `bundle: model.belongsTo(() => Bundle, { mappedBy: "items" })` is correct and matches the docs.
// - Using `product` / `variant` as `belongsTo` to core Product models is **not** how the bundled-products recipe is implemented; instead, you should:
//   - Keep `BundleItem` as a pure module model.
//   - Use **module links** to associate bundle items with products (and, if needed, variants).
// - Adding extra numeric/text fields is technically supported by the DML, but this exact structure is not documented in the bundled-products example, so I can’t confirm it as “correct” beyond type compatibility.