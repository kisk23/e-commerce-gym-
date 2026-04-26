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
import { useEffect, useMemo, useState } from "react"

export type BundleCardAddPayload = {
  product: HttpTypes.StoreProduct
  quantity: number
  variantId: string
}

type Props = {
  product: HttpTypes.StoreProduct
  onAdd?: (_payload: BundleCardAddPayload) => void
}

export default function BundleCard({ product, onAdd }: Props) {
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product])
  const [quantity, setQuantity] = useState(100)
  const [variantId, setVariantId] = useState(defaultVariant?.id || "")

  useEffect(() => {
    setVariantId(defaultVariant?.id || "")
  }, [defaultVariant?.id])

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
    if (!canAdd) {
      return
    }

    onAdd?.({
      product,
      quantity,
      variantId,
    })
  }

  return (
    <div className="w-full max-w-[320px] rounded-xl border border-gray-200 bg-white p-3 flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="relative w-20 h-20 shrink-0">
          <Image
            src={image}
            alt={product.title || "Bundle item"}
            fill
            className="object-cover rounded-lg"
          />
        </div>

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
            <span>
              {Math.round(nutritionPer100g.calories)} cal/100g
              {" • "}
              C {Math.round(nutritionPer100g.carbs)}g
              {" • "}
              F {Math.round(nutritionPer100g.fat)}g
              {" • "}
              P {Math.round(nutritionPer100g.protein)}g
            </span>
            <span className="font-medium text-black">
              {convertToLocale({
                amount: unitPrice,
                currency_code: currencyCode,
              })}
              /100g
            </span>
          </div>
        </div>
      </div>

      <select
        value={variantId}
        onChange={(event) => setVariantId(event.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
      >
        {(product.variants || []).map((variant) => (
          <option key={variant.id} value={variant.id}>
            {variant.title || "Default"}
          </option>
        ))}
      </select>

      <input
        type="number"
        min={1}
        value={quantity}
        onChange={(event) =>
          setQuantity(Math.max(1, Math.round(Number(event.target.value) || 1)))
        }
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
      />

      <div className="flex justify-between text-xs text-primary/70">
        <span>{Math.round(totalCalories)} cal</span>
        <span>
          {convertToLocale({
            amount: totalPrice,
            currency_code: currencyCode,
          })}
        </span>
      </div>

      <button
        onClick={onAddToBundle}
        disabled={!canAdd}
        className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Add to Bundle
      </button>
    </div>
  )
}
