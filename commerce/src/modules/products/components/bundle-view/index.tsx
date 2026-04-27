"use client"

import { StoreBundle } from "@lib/types/bundle"
import Image from "next/image"
import { Fire, ShoppingBag, ShoppingCart } from "@medusajs/icons"

export default function BundleView({
  bundle,
}: {
  bundle: StoreBundle
}) {
  const title = bundle.title
  const subtitle = bundle.description ?? "Fresh and nutritious"
  const thumbnail = bundle.items?.[0]?.thumbnail ?? null
  const calories = bundle.total_calories
  const weightG = bundle.total_weight
  const productCount = bundle.items?.length ?? 0
  const includes = bundle.items?.map(i => i.product_title) ?? []
  const discountPct = bundle.discount_percentage ?? 0
  const originalPrice = bundle.total_price ?? 0
  
  // Format price assuming it is a number. Adjust if you need a specific currency formatter.
  const discountedPrice = originalPrice ? (originalPrice * (1 - discountPct / 100)).toFixed(2) : "0.00"

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
          {discountPct > 0 && (
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
                {includes.map((item, idx) => (
                  <span
                    key={idx}
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
              {originalPrice > 0 && (
                <span className="text-sm text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
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

