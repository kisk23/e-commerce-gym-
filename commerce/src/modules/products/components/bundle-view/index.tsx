"use client"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { getProductPrice } from "@lib/util/get-product-price"
import { Fire, ShoppingBag, ShoppingCart } from "@medusajs/icons"

// ─── Dummy data ──────────────────────────────
const USE_DUMMY = true   // ← flip to false to use real Medusa data

const DUMMY = {
  title: "Weight Loss Starter",
  subtitle: "Perfect low-calorie bundle for cutting",
  handle: "weight-loss-starter",
  thumbnail: null as string | null,   // swap in a real URL to preview with photo
  calories: 150,
  weightG: 700,
  productCount: 4,
  includes: ["Spinach", "Tomatoes", "Cucumber", "Strawberries"],
  discountPercent: 10,
  originalPrice: 8.99,
}
// ─────────────────────────────────────────────────────────────────────────────

type ProductMetadata = {
  nutrition_per_100g?: { calories?: number }
  weight_g?: number
  includes?: string[]
  discount_percent?: number
}

export default function BundleView({
  product,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const metadata = product.metadata as ProductMetadata | null

  // Resolve values — dummy takes priority when USE_DUMMY is true
  const title           = USE_DUMMY ? DUMMY.title           : product.title
  const subtitle        = USE_DUMMY ? DUMMY.subtitle        : product.subtitle ?? "Fresh and nutritious"
  const handle          = USE_DUMMY ? DUMMY.handle          : product.handle
  const thumbnail       = USE_DUMMY ? DUMMY.thumbnail       : product.thumbnail
  const calories        = USE_DUMMY ? DUMMY.calories        : metadata?.nutrition_per_100g?.calories
  const weightG         = USE_DUMMY ? DUMMY.weightG         : metadata?.weight_g
  const productCount    = USE_DUMMY ? DUMMY.productCount    : (product.variants?.length ?? 1)
  const includes        = USE_DUMMY ? DUMMY.includes        : (metadata?.includes ?? [])
  const discountPct     = USE_DUMMY ? DUMMY.discountPercent : metadata?.discount_percent
  const originalPrice   = USE_DUMMY ? DUMMY.originalPrice   : null
  const discountedPrice = USE_DUMMY
  ? `${(DUMMY.originalPrice * (1 - DUMMY.discountPercent / 100)).toFixed(2)}`
  : (cheapestPrice?.calculated_price ?? "0.00")

  return (
      <div className="w-full max-w-[400px] rounded-[26px] overflow-hidden bg-white border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">

        {/* ── IMAGE ── */}
        <div className="relative w-full h-[300px] bg-[#c8d8b0]">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={`${title} thumbnail`}
              fill
              className="object-cover"
            />
          ) : (
            <Image src="/Logo.svg" alt="Logo" fill className="object-contain" />
          )}

          {/* Discount badge */}
          {discountPct && (
            <div
              className="absolute top-3 right-3 text-white text-sm font-semibold px-3 py-1 rounded-full bg-accent"
            >
              -{discountPct}%
            </div>
          )}
        </div>

        {/* ── CONTENT ── */}
        <div className="flex flex-col gap-4 px-5 py-5">

          {/* Title + subtitle */}
          <div>
            <h3 className="text-xl font-bold leading-tight">{title}</h3>
            <p className="text-sm text-gray-400 my-2">{subtitle}</p>
          </div>

          {/* Stats row */}
          <div
            className="flex items-center justify-between rounded-2xl px-4 py-5 bg-beige-light/60"          >
            {/* Calories */}
            {calories != null && (
              <>
                <div className="flex flex-col items-center gap-0.5">
                  <Fire color="#213C02"/>
                  <span className="text-sm text-gray-500">Calories</span>
                  <span className="text-sm font-bold text-gray-800">{calories}</span>
                </div>
              </>
            )}

            {/* Weight */}
            {weightG != null && (
              <>
                <div className="flex flex-col items-center gap-0.5">
                  <ShoppingBag color="#213C02"/>
                  <span className="text-sm text-gray-500">Weight</span>
                  <span className="text-sm font-bold text-gray-800">{weightG}g</span>
                </div>
              </>
            )}

            {/* Products count */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm text-gray-500">Products</span>
              <span className="text-sm font-bold text-gray-800">{productCount}</span>
            </div>
          </div>

          {/* Includes */}
          {includes.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Includes:</p>
              <div className="flex flex-wrap gap-2">
                {includes.map((item) => (
                  <span
                    key={item}
                    className="text-sm fw-semibold border border-gray-200 rounded-full px-3 py-1"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Price + actions */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {originalPrice && (
                <span className="text-sm text-gray-400 line-through">${originalPrice}</span>
              )}
              <span className="text-2xl font-semibold text-primary leading-none">
                ${discountedPrice}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Details */}
              <button
                onClick={(e) => e.preventDefault()}
                className="text-sm font-medium text-gray-700 border-2 border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Details
              </button>

              {/* Add to cart */}
              <button
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-1.5 text-sm border-2 border-black font-semibold text-white rounded-md px-4 py-2 transition-colors hover:opacity-90 bg-primary"
              >
                <ShoppingCart />
                Add
              </button>
            </div>
          </div>

        </div>
      </div>
  )
}
