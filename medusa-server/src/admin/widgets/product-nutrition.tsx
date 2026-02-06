import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

type NutritionPer100g = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

const emptyNutrition: NutritionPer100g = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
}

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeNutrition = (value: unknown): NutritionPer100g => {
  if (!value || typeof value !== "object") {
    return { ...emptyNutrition }
  }

  const payload = value as Record<string, unknown>

  return {
    calories: Math.max(0, toNumber(payload.calories)),
    protein: Math.max(0, toNumber(payload.protein)),
    carbs: Math.max(0, toNumber(payload.carbs)),
    fat: Math.max(0, toNumber(payload.fat)),
  }
}

const getProductIdFromPath = (path: string) => {
  const match = path.match(/products\/([^/]+)/)
  return match?.[1] ?? null
}

const ProductNutritionWidget = () => {
  const [productId, setProductId] = useState<string | null>(null)
  const [productTitle, setProductTitle] = useState("")
  const [nutrition, setNutrition] = useState<NutritionPer100g>({ ...emptyNutrition })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    setProductId(getProductIdFromPath(window.location.pathname))
  }, [])

  useEffect(() => {
    if (!productId) {
      return
    }

    const loadNutrition = async () => {
      setIsLoading(true)
      setMessage(null)

      try {
        const response = await fetch(`/admin/product-nutrition/${productId}`)
        if (!response.ok) {
          setMessage("Could not load nutrition data.")
          return
        }

        const body = (await response.json()) as {
          product?: {
            title?: string
            nutrition_per_100g?: NutritionPer100g
          }
        }

        setProductTitle(body.product?.title || "")
        setNutrition(normalizeNutrition(body.product?.nutrition_per_100g))
      } catch {
        setMessage("Could not load nutrition data.")
      } finally {
        setIsLoading(false)
      }
    }

    loadNutrition()
  }, [productId])

  const updateNutrition = (field: keyof NutritionPer100g, value: string) => {
    const numeric = Number(value)
    setNutrition((current) => ({
      ...current,
      [field]: Number.isFinite(numeric) ? Math.max(0, numeric) : 0,
    }))
  }

  const saveNutrition = async () => {
    if (!productId) {
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/admin/product-nutrition/${productId}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          nutrition_per_100g: nutrition,
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null
        setMessage(body?.message || "Could not save nutrition data.")
        return
      }

      setMessage("Nutrition data saved.")
    } catch {
      setMessage("Could not save nutrition data.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-ui-border-base p-4 bg-ui-bg-base">
      <h2 className="text-lg font-semibold">Nutrition per 100g</h2>
      <p className="text-ui-fg-subtle text-sm">
        {productTitle ? `Product: ${productTitle}` : "Update nutrition values for this product."}
      </p>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
        <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
          Calories
          <input
            type="number"
            min={0}
            step="0.01"
            value={nutrition.calories}
            onChange={(event) => updateNutrition("calories", event.target.value)}
            className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
            disabled={isLoading || isSaving}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
          Protein (g)
          <input
            type="number"
            min={0}
            step="0.01"
            value={nutrition.protein}
            onChange={(event) => updateNutrition("protein", event.target.value)}
            className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
            disabled={isLoading || isSaving}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
          Carbs (g)
          <input
            type="number"
            min={0}
            step="0.01"
            value={nutrition.carbs}
            onChange={(event) => updateNutrition("carbs", event.target.value)}
            className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
            disabled={isLoading || isSaving}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
          Fat (g)
          <input
            type="number"
            min={0}
            step="0.01"
            value={nutrition.fat}
            onChange={(event) => updateNutrition("fat", event.target.value)}
            className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
            disabled={isLoading || isSaving}
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={saveNutrition}
          className="rounded-md bg-ui-bg-interactive text-ui-fg-on-color px-4 py-2 disabled:opacity-50"
          disabled={isSaving || isLoading}
        >
          {isSaving ? "Saving..." : "Save nutrition"}
        </button>
        {message ? <span className="text-ui-fg-subtle text-sm">{message}</span> : null}
      </div>
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductNutritionWidget
