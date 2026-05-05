"use client"

import Image from "next/image"
import { Fire, ShoppingBag, ShoppingCart } from "@medusajs/icons"
import { StoreBundle } from "@lib/types/bundle"

type Props = {
  bundle: StoreBundle
  onAddToCart?: () => void | Promise<void>
  isAdding?: boolean
}

export default function BundleView({ bundle, onAddToCart, isAdding = false }: Props) {
  const title = bundle.title
  const subtitle = bundle.description || "Fresh and nutritious"

  const thumbnail =
    bundle.thumbnail ||
    bundle.items?.find((i) => i.thumbnail)?.thumbnail ||
    "/Logo.svg"

  const calories = bundle.total_calories
  const weightG = bundle.total_weight
  const productCount = bundle.items?.length || 0
  const includes = bundle.items?.map((i) => i.product_title) || []

  const discountPct = bundle.discount_percentage || 0
  const originalPrice = Number(bundle.total_price || 0)
  

  const discountedPrice =
    discountPct > 0
      ? originalPrice * (1 - discountPct / 100)
      : originalPrice

  const handleAdd = () => {
    if (!onAddToCart) {
      return
    }
    onAddToCart()
  }

  const getCurrencySymbol = (currencyCode: string, locale = "en") => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(0)
    .replace(/\d/g, "")
    .trim()
}

  return (
    <div className="w-full max-w-[400px] rounded-[26px] overflow-hidden bg-white border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">

      {/* IMAGE */}
      <div className="relative w-full h-[300px] bg-[#c8d8b0]">
        <Image
          src={thumbnail}
          alt={`${title} thumbnail`}
          fill
          className="object-cover"
        />

        {discountPct > 0 && (
          <div className="absolute top-3 right-3 text-white text-sm font-semibold px-3 py-1 rounded-full bg-accent">
            -{discountPct}%
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex flex-col gap-4 px-5 py-5">

        {/* Title */}
        <div>
          <h3 className="text-xl font-bold leading-tight">{title}</h3>
          <p className="text-sm text-gray-400 my-2">{subtitle}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between rounded-2xl px-4 py-5 bg-beige-light/60">

          {calories !== null && calories !== undefined && (
            <div className="flex flex-col items-center gap-0.5">
              <Fire color="#213C02" />
              <span className="text-sm text-gray-500">Calories</span>
              <span className="text-sm font-bold text-gray-800">
                {calories}
              </span>
            </div>
          )}

          {weightG !== null && weightG !== undefined && (
            <div className="flex flex-col items-center gap-0.5">
              <ShoppingBag color="#213C02" />
              <span className="text-sm text-gray-500">Weight</span>
              <span className="text-sm font-bold text-gray-800">
                {weightG}g
              </span>
            </div>
          )}

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm text-gray-500">Products</span>
            <span className="text-sm font-bold text-gray-800">
              {productCount}
            </span>
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
                  className="text-sm font-semibold border border-gray-200 rounded-full px-3 py-1"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100" />

        {/* Price + Actions */}
        <div className="flex items-center justify-between">

          <div className="flex flex-col">
            {discountPct > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {originalPrice.toFixed(2)}{getCurrencySymbol(bundle.currency_code??"USD")}
              </span>
            )}
            <span className="text-lg font-semibold text-primary leading-none">
              {discountedPrice.toFixed(2)}{getCurrencySymbol(bundle.currency_code??"USD")}
            </span>
          </div>

          <div className="flex items-center gap-2">

            <button
              className="text-sm font-medium text-gray-700 border-2 border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              Details
            </button>

            <button
              onClick={handleAdd}
              disabled={isAdding}
              className="flex items-center gap-1.5 text-sm border-2 border-black font-semibold text-white rounded-md px-4 py-2 transition-colors hover:opacity-90 bg-primary"
            >
              <ShoppingCart />
              {isAdding ? "Adding..." : "Add"}
            </button>

          </div>
        </div>

      </div>
    </div>
  )
}
