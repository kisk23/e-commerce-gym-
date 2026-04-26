"use client"
import Image from "next/image"
import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@/lib/util/get-product-price"
type ProductMetadata = {
  nutrition_per_100g?: {
    calories?: number
  }
}
type Props = {
  product: HttpTypes.StoreProduct
  onAdd?: (product: HttpTypes.StoreProduct, quantity: number) => void
}

export default function BundleCard({ product, onAdd }: Props) {
  const [quantity, setQuantity] = useState(100)

  // ---- SAFE DATA EXTRACTION ----
  const metadata = product.metadata as ProductMetadata | null

  const caloriesPer100g =
    metadata?.nutrition_per_100g?.calories ?? 0

  const categoryName =
    product.categories?.[0]?.name ?? "Unknown"

  const image = product.thumbnail ?? "/placeholder.png"
  // ⚠️ Medusa pricing (simplified — assumes first variant)
const { cheapestPrice } = getProductPrice({ product })

const unitPrice =
  cheapestPrice?.calculated_price_number ?? 0

  // ---- CALCULATIONS ----
  const totalCalories = (caloriesPer100g * quantity) / 100
  const totalPrice = (unitPrice * quantity) / 100

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
    }).format(amount)

  // ---- UI ----
  return (
    <div className="w-full max-w-[320px] rounded-xl border border-gray-200 bg-white p-3 flex flex-col gap-3">

      {/* TOP */}
      <div className="flex gap-3">
        {/* IMAGE */}
        <div className="relative w-20 h-20 shrink-0">
          <Image
            src={image}
            alt={product.title}
            fill
            className="object-cover rounded-lg"
          />
        </div>

        {/* INFO */}
        <div className="flex flex-col justify-between flex-1">
          <div>
            <h3 className="text-base font-semibold text-black">
              {product.title}
            </h3>

            <span className="inline-block mt-1 px-2 py-1 text-xs border rounded-full">
              {categoryName}
            </span>
          </div>

          <div className="flex justify-between text-xs text-primary/70 mt-2">
            <span>{caloriesPer100g} cal/100g</span>
            <span className="font-medium text-black">
              {formatPrice(unitPrice)}/100g
            </span>
          </div>
        </div>
      </div>

      {/* INPUT */}
      <input
        type="number"
        value={quantity}
        onChange={(e) =>
          setQuantity(Math.max(0, Number(e.target.value) || 0))
        }
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
      />

      {/* TOTAL */}
      <div className="flex justify-between text-xs text-primary/70">
        <span>{Math.round(totalCalories)} cal</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>

      {/* BUTTON */}
      <button
        onClick={() => onAdd?.(product, quantity)}
        className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
      >
        Add to Bundle
      </button>
    </div>
  )
}