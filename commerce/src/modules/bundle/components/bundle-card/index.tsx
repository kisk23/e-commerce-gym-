"use client"

import { convertToLocale } from "@lib/util/money"
import {
  calculateProductTotals,
  getCurrencyCodeForVariant,
  getDefaultVariant,
  getProductNutritionPer100g,
  getUnitPriceForVariant,
} from "@modules/bundle/utils/bundle-calculations"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

export type BundleCardAddPayload = {
  product: HttpTypes.StoreProduct
  quantity: number
  variantId: string
}

type Props = {
  product: HttpTypes.StoreProduct
  onAdd?: (_payload: BundleCardAddPayload) => void
}

const WEIGHT_STEP_G = 100
const MIN_ITEM_WEIGHT_G = 1000

type AnimState = "idle" | "ripple" | "success"

export default function BundleCard({ product, onAdd }: Props) {
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product])
  const [quantity, setQuantity] = useState(MIN_ITEM_WEIGHT_G)
  const [variantId, setVariantId] = useState(defaultVariant?.id || "")
  const [animState, setAnimState] = useState<AnimState>("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setVariantId(defaultVariant?.id || "")
  }, [defaultVariant?.id])

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const nutritionPer100g = getProductNutritionPer100g(product)
  const categoryName = product.categories?.[0]?.name ?? "Unknown"
  const image = product.thumbnail ?? "/placeholder.png"

  const unitPrice = getUnitPriceForVariant(product, variantId)
  const currencyCode = getCurrencyCodeForVariant(product, variantId)
  const { calories: totalCalories, price: totalPrice } = calculateProductTotals({
    product,
    quantity,
    variantId,
  })

  const canAdd = !!variantId && quantity > 0

  const onAddToBundle = () => {
    if (!canAdd || animState !== "idle") return

    // Kick off the ripple → success animation sequence
    setAnimState("ripple")

    timerRef.current = setTimeout(() => {
      setAnimState("success")
      onAdd?.({ product, quantity, variantId })

      timerRef.current = setTimeout(() => {
        setAnimState("idle")
      }, 1400)
    }, 280)
  }

  const btnLabel =
    animState === "success" ? "Added ✓" : animState === "ripple" ? "Adding…" : "Add to Bundle"

  const btnClass =
    animState === "success"
      ? "bg-emerald-500 scale-[0.97] shadow-emerald-200 shadow-lg"
      : animState === "ripple"
      ? "bg-primary/80 scale-[0.98]"
      : "bg-primary hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 hover:-translate-y-0.5"

  return (
    <div
      className="w-full rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 p-4 flex flex-col gap-3"
      style={{ contain: "layout" }}
    >
      {/* Product header */}
      <div className="flex gap-3">
        <div className="relative w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden">
          <Image
            src={image}
            alt={product.title || "Bundle item"}
            fill
            className="object-cover"
            sizes="72px"
          />
        </div>

        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
              {product.title}
            </h3>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium border border-gray-200 rounded-full text-gray-500 uppercase tracking-wide">
              {categoryName}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
            <span>
              {Math.round(nutritionPer100g.calories)} cal/100g
            </span>
            <span className="font-semibold text-gray-700 text-xs">
              {convertToLocale({ amount: unitPrice, currency_code: currencyCode })}/100g
            </span>
          </div>
        </div>
      </div>

      {/* Macro pills */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: "Carbs", value: Math.round(nutritionPer100g.carbs), unit: "g" },
          { label: "Fat", value: Math.round(nutritionPer100g.fat), unit: "g" },
          { label: "Protein", value: Math.round(nutritionPer100g.protein), unit: "g" },
        ].map(({ label, value, unit }) => (
          <span
            key={label}
            className="px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] text-gray-500"
          >
            <span className="font-medium text-gray-700">{value}{unit}</span> {label}
          </span>
        ))}
      </div>

      {/* Quantity input */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() =>
            setQuantity((q) => Math.max(MIN_ITEM_WEIGHT_G, q - WEIGHT_STEP_G))
          }
          className="w-8 h-8 shrink-0 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-base flex items-center justify-center transition"
        >
          −
        </button>
        <input
          type="number"
          min={MIN_ITEM_WEIGHT_G}
          step={WEIGHT_STEP_G}
          value={quantity}
          onChange={(e) =>
            setQuantity(
              Math.max(
                MIN_ITEM_WEIGHT_G,
                Math.round(
                  (Number(e.target.value) || MIN_ITEM_WEIGHT_G) / WEIGHT_STEP_G
                ) * WEIGHT_STEP_G
              )
            )
          }
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-center outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition"
        />
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQuantity((q) => q + WEIGHT_STEP_G)}
          className="w-8 h-8 shrink-0 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-base flex items-center justify-center transition"
        >
          +
        </button>
        <span className="text-xs text-gray-400 shrink-0">g</span>
      </div>

      {/* Totals row */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-0.5">
        <span>{Math.round(totalCalories)} cal total</span>
        <span className="font-semibold text-gray-700 text-sm">
          {convertToLocale({ amount: totalPrice, currency_code: currencyCode })}
        </span>
      </div>

      {/* Add to Bundle button — animated */}
      <button
        onClick={onAddToBundle}
        disabled={!canAdd || animState !== "idle"}
        aria-live="polite"
        className={[
          "relative w-full py-2.5 rounded-xl text-white text-sm font-semibold",
          "transition-all duration-300 overflow-hidden",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          btnClass,
        ].join(" ")}
      >
        {/* Ripple layer */}
        {animState === "ripple" && (
          <span
            className="absolute inset-0 animate-ping rounded-xl bg-white/20"
            aria-hidden="true"
          />
        )}
        {/* Success shimmer */}
        {animState === "success" && (
          <span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_0.6s_ease-in-out_forwards]"
            aria-hidden="true"
          />
        )}
        <span className="relative">{btnLabel}</span>
      </button>

      <style jsx>{`
        @keyframes shimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
