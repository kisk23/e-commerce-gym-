"use client"

import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { getProductPrice } from "@lib/util/get-product-price"
import { KeyboardEvent } from "react"

type ProductMetadata = {
  nutrition_per_100g?: {
    calories?: number
  }
  category?: string
}

export default function ProductPreview({
  product,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })

  const metadata = product.metadata as ProductMetadata | null

  const calories = metadata?.nutrition_per_100g?.calories

  const categoryName = product.categories?.[0]?.name ?? null
  const href = product.handle ? `/products/${product.handle}` : null

  const openOnSpace = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== " ") {
      return
    }

    event.preventDefault()
    event.currentTarget.click()
  }

  const card = (
    <>
      {/* CARD */}
      <div className="group/card w-full max-w-[302px] rounded-[26px] border border-[#E6E6E6] overflow-hidden bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-500 ease-out">
        {/* IMAGE */}
        <div className="relative w-full h-[302px] bg-[#F5F5F5] overflow-hidden">
          {product.thumbnail && (
            <Image
              src={product.thumbnail}
              alt={`${product.title} product image`}
              fill
              className="object-cover rounded-t-[26px] transition-transform duration-700 ease-out group-hover/card:scale-110"
            />
          )}

          {/* BADGE */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold text-[#1A330B] capitalize shadow-sm transition-transform duration-300 group-hover/card:scale-105">
            {categoryName}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col gap-2 px-6 py-5">
          {/* TITLE + DESCRIPTION */}
          <div className="flex flex-col gap-1">
            <h3 className="text-lg sm:text-xl font-bold text-[#0A0A0A]">
              {product.title}
            </h3>

            <p className="text-[#717182] text-sm">
              {product.subtitle || product.description ||
                "Fresh and nutritious, perfect for your healthy meals"}
            </p>
          </div>

          {/* INFO ROW */}
          <div className="flex justify-between items-end mt-2">
            {/* LEFT */}
            <div className="flex flex-col">
              <span className="text-[#717182] text-xs font-medium">Per 100g</span>
              <span className="text-sm font-bold text-[#1A330B]">
                {calories} kcal
              </span>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col items-end">
              <span className="text-[#717182] text-xs font-medium">Price</span>
              <span className="text-base font-bold text-[#0A0A0A]">
                {cheapestPrice?.calculated_price ?? "$0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  if (!href) {
    return <div className="group mx-auto">{card}</div>
  }

  return (
    <LocalizedClientLink
      href={href}
      className="group mx-auto block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
      aria-label={`View ${product.title}`}
      onKeyDown={openOnSpace}
    >
      {card}
    </LocalizedClientLink>
  )
}
