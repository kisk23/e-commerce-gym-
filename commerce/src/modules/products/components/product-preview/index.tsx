"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { getProductPrice } from "@lib/util/get-product-price"

type ProductMetadata = {
  nutrition_per_100g?: {
    calories?: number
  }
  category?: string
}

export default function ProductPreview({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })

  const metadata = product.metadata as ProductMetadata | null

  const calories = metadata?.nutrition_per_100g?.calories
  console.log("calories: "+calories)
  const category = metadata?.category ?? "food"

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group"
    >
      {/* CARD */}
      <div className="w-full max-w-[302px] rounded-[26px] border border-gray-200 overflow-hidden bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200">

        {/* IMAGE */}
        <div className="relative w-full h-[302px] bg-beige/20">
          {product.thumbnail && (
            <Image
              src={product.thumbnail}
              alt={`${product.title} product image`}
              fill
              className="object-cover rounded-t-[26px]"
            />
          )}

          {/* BADGE */}
          <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-medium text-primary capitalize">
            {category}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col gap-2 px-6 py-5">

          {/* TITLE + DESCRIPTION */}
          <div className="flex flex-col gap-1">
            <h3 className="text-lg sm:text-xl font-semibold text-black">
              {product.title}
            </h3>

            <p className="text-primary/70 text-sm">
              {product.subtitle ||
                "Fresh and nutritious, perfect for your healthy meals"}
            </p>
          </div>

          {/* INFO ROW */}
          <div className="flex justify-between items-end">

            {/* LEFT */}
            <div className="flex flex-col">
              <span className="text-primary/60 text-sm">
                Per 100g
              </span>
              <span className="text-base font-semibold text-primary">
                {calories} kcal
              </span>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col items-end">
              <span className="text-primary/60 text-sm">
                Price
              </span>

              <span className="text-base font-semibold text-black">
                {cheapestPrice?.calculated_price ?? "$0.00"}
              </span>
            </div>

          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}