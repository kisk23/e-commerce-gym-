import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"

type AdminProduct = {
  id: string
  title: string
  variants: {
    id: string
    title: string
    prices?: {
      amount: number
      currency_code: string
      price_list_id?: string | null
    }[]
  }[]
  nutrition_per_100g: ProductNutrition
}

type ProductNutrition = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

type AdminBundle = {
  id: string
  title: string
  description: string | null
  bundle_type: string | null
  discount_percentage: number
  is_active: boolean
  total_weight: number
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_price?: number
  currency_code?: string | null
  items: {
    id: string
    product_id: string
    product_title: string
    variant_id: string
    variant_title: string
    quantity: number
    weight: number
    calories: number
    protein: number
    carbs: number
    fat: number
  }[]
}

type BundleItemForm = {
  product_id: string
  variant_id: string
  quantity: number
  weight: number
  nutrition_per_100g: ProductNutrition
}

const createEmptyItem = (): BundleItemForm => ({
  product_id: "",
  variant_id: "",
  quantity: 1,
  weight: 0,
  nutrition_per_100g: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  },
})

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const roundValue = (value: number) => Math.round(value * 100) / 100
const normalizeCurrencyCode = (value?: string | null) =>
  typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null
const pickVariantPrice = (
  variant: AdminProduct["variants"][number] | undefined,
  currencyCode?: string | null
) => {
  if (!variant) {
    return 0
  }

  const normalizedCurrency = normalizeCurrencyCode(currencyCode)
  const prices = (variant.prices || []).filter(
    (price): price is { amount: number; currency_code: string; price_list_id?: string | null } =>
      !!price && typeof price.amount === "number" && typeof price.currency_code === "string"
  )

  if (!prices.length) {
    return 0
  }

  const byCurrency = normalizedCurrency
    ? prices.filter((price) => price.currency_code.toLowerCase() === normalizedCurrency)
    : prices

  const basePrice =
    byCurrency.find((price) => !price.price_list_id) ||
    byCurrency[0] ||
    prices.find((price) => !price.price_list_id) ||
    prices[0]

  return Math.max(0, basePrice?.amount ?? 0)
}
const formatMoney = (amount: number, currencyCode?: string | null) => {
  const code = (currencyCode || "aed").toUpperCase()
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(amount)
}

const getNutritionFromMetadata = (
  metadata: Record<string, unknown> | null | undefined
): ProductNutrition => {
  const nutrition =
    (metadata?.nutrition_per_100g as Record<string, unknown> | undefined) || {}

  return {
    calories: Math.max(0, toNumber(nutrition.calories)),
    protein: Math.max(0, toNumber(nutrition.protein)),
    carbs: Math.max(0, toNumber(nutrition.carbs)),
    fat: Math.max(0, toNumber(nutrition.fat)),
  }
}

const getCalculatedNutrition = (item: BundleItemForm) => {
  const factor = item.weight / 100
  return {
    calories: roundValue(item.nutrition_per_100g.calories * factor),
    protein: roundValue(item.nutrition_per_100g.protein * factor),
    carbs: roundValue(item.nutrition_per_100g.carbs * factor),
    fat: roundValue(item.nutrition_per_100g.fat * factor),
  }
}

const BundlesPage = () => {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [bundles, setBundles] = useState<AdminBundle[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [bundleType, setBundleType] = useState("bulk")
  const [discountPercentage, setDiscountPercentage] = useState(10)
  const [items, setItems] = useState<BundleItemForm[]>([createEmptyItem()])
  const [currencyCode, setCurrencyCode] = useState("aed")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  )

  const loadData = async () => {
    setMessage(null)

    const productsResponse = await fetch("/admin/bundles/products")

    if (!productsResponse.ok) {
      setProducts([])
      setMessage("Could not load products for bundle items.")
      return
    }

    const productsBody = (await productsResponse.json()) as {
      products?: (AdminProduct & {
        metadata?: Record<string, unknown> | null
        variants?: {
          id: string
          title: string
          price_set?: {
            prices?: {
              amount: number
              currency_code: string
              price_list_id?: string | null
            }[]
          } | null
        }[]
      })[]
      currency_code?: string | null
    }

    const normalizedProducts = (productsBody.products || [])
      .filter((product) => !!product?.id)
      .map((product) => ({
        id: product.id,
        title: product.title || "Untitled product",
        variants: (product.variants || [])
          .filter((variant) => !!variant?.id)
          .map((variant) => ({
            id: variant.id,
            title: variant.title,
            prices: (variant.price_set?.prices || []).filter(
              (price) =>
                !!price &&
                typeof price.amount === "number" &&
                typeof price.currency_code === "string"
            ),
          })),
        nutrition_per_100g: getNutritionFromMetadata(product.metadata),
      }))

    setProducts(normalizedProducts)
    setCurrencyCode(
      typeof productsBody.currency_code === "string" && productsBody.currency_code.trim()
        ? productsBody.currency_code.trim().toLowerCase()
        : "aed"
    )

    const bundlesResponse = await fetch("/admin/bundles")

    if (!bundlesResponse.ok) {
      setBundles([])
      setMessage("Products loaded, but bundles failed to load.")
      return
    }

    const bundlesBody = (await bundlesResponse.json()) as {
      bundles?: AdminBundle[]
    }

    setBundles(bundlesBody.bundles || [])
  }

  useEffect(() => {
    loadData().catch(() => {
      setMessage("Could not load bundles data.")
    })
  }, [])

  const updateItem = (index: number, nextItem: BundleItemForm) => {
    setItems((previousItems) =>
      previousItems.map((item, itemIndex) => (itemIndex === index ? nextItem : item))
    )
  }

  const calculateItemPrice = (item: BundleItemForm) => {
    const product = productMap.get(item.product_id)
    const variant = product?.variants?.find((entry) => entry.id === item.variant_id)
    const pricePer100g = pickVariantPrice(variant, currencyCode)
    return (pricePer100g * item.weight * item.quantity) / 100
  }

  const bundleTotalPrice = useMemo(() => {
    const total = items.reduce((acc, item) => acc + calculateItemPrice(item), 0)
    return roundValue(total)
  }, [items, productMap, currencyCode])

  const onSelectProduct = (index: number, productId: string) => {
    const product = productMap.get(productId)
    const firstVariant = product?.variants?.[0]
    updateItem(index, {
      ...items[index],
      product_id: productId,
      variant_id: firstVariant?.id || "",
      nutrition_per_100g: product?.nutrition_per_100g || createEmptyItem().nutrition_per_100g,
    })
  }

  const onChangeQuantity = (index: number, quantityValue: string) => {
    const quantity = Math.max(1, Math.round(Number(quantityValue) || 1))
    updateItem(index, {
      ...items[index],
      quantity,
    })
  }

  const onChangeWeight = (index: number, weightValue: string) => {
    const weight = Math.max(0, Number(weightValue) || 0)
    updateItem(index, {
      ...items[index],
      weight,
    })
  }

  const addItem = () => {
    setItems((previousItems) => [...previousItems, createEmptyItem()])
  }

  const removeItem = (index: number) => {
    setItems((previousItems) =>
      previousItems.filter((_, itemIndex) => itemIndex !== index)
    )
  }

  const createBundle = async () => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch("/admin/bundles", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          bundle_type: bundleType,
          discount_percentage: discountPercentage,
          items: items.map((item) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            weight: item.weight,
          })),
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null
        setMessage(body?.message || "Could not create bundle.")
        return
      }

      setTitle("")
      setDescription("")
      setBundleType("bulk")
      setDiscountPercentage(10)
      setItems([createEmptyItem()])
      setMessage("Bundle created successfully.")
      await loadData()
    } catch {
      setMessage("Could not create bundle.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteBundle = async (bundleId: string) => {
    const response = await fetch(`/admin/bundles/${bundleId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      setMessage("Could not delete bundle.")
      return
    }

    setMessage("Bundle deleted.")
    await loadData()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="rounded-lg border border-ui-border-base p-4 bg-ui-bg-base">
        <h1 className="text-xl font-semibold mb-2">Create Product Bundle</h1>
        <p className="text-ui-fg-subtle mb-4">
          Nutrition totals are auto-calculated from product per-100g data and weight.
        </p>
        <div className="grid grid-cols-1 gap-3">
          <input
            placeholder="Bundle title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-md border border-ui-border-base px-3 py-2"
          />
          <textarea
            placeholder="Bundle description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-md border border-ui-border-base px-3 py-2"
          />
          <select
            value={bundleType}
            onChange={(event) => setBundleType(event.target.value)}
            className="rounded-md border border-ui-border-base px-3 py-2"
          >
            <option value="bulk">Bulk</option>
            <option value="cut">Cut</option>
            <option value="maintenance">Maintenance</option>
            <option value="performance">Performance</option>
            <option value="general">General</option>
          </select>
          <input
            type="number"
            min={1}
            max={99}
            value={discountPercentage}
            onChange={(event) =>
              setDiscountPercentage(Math.max(1, Math.min(99, Number(event.target.value) || 1)))
            }
            className="rounded-md border border-ui-border-base px-3 py-2"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {items.map((item, index) => {
            const calculatedNutrition = getCalculatedNutrition(item)
            return (
              <div key={`item-${index}`} className="flex flex-col gap-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                  <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
                    Product
                    <select
                      value={item.product_id}
                      onChange={(event) => onSelectProduct(index, event.target.value)}
                      className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
                    Quantity
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => onChangeQuantity(index, event.target.value)}
                      className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
                    Weight (g)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.weight}
                      onChange={(event) => onChangeWeight(index, event.target.value)}
                      className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded-md border border-ui-border-base px-3 py-2"
                    disabled={items.length === 1}
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
                    Calories (auto)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={calculatedNutrition.calories}
                      className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
                      disabled
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
                    Protein (g)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={calculatedNutrition.protein}
                      className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
                      disabled
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
                    Carbs (g)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={calculatedNutrition.carbs}
                      className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
                      disabled
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
                    Fat (g)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={calculatedNutrition.fat}
                      className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base"
                      disabled
                    />
                  </label>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={addItem}
            className="rounded-md border border-ui-border-base px-4 py-2"
          >
            Add product
          </button>
          <button
            type="button"
            onClick={createBundle}
            disabled={isSubmitting}
            className="rounded-md bg-ui-bg-interactive text-ui-fg-on-color px-4 py-2 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create bundle"}
          </button>
        </div>
        <p className="mt-3 text-ui-fg-subtle text-sm">
          Total Price (auto): {formatMoney(bundleTotalPrice, currencyCode)}
        </p>
        {message ? <p className="mt-3 text-ui-fg-subtle">{message}</p> : null}
      </div>

      <div className="rounded-lg border border-ui-border-base p-4 bg-ui-bg-base">
        <h2 className="text-lg font-semibold mb-3">Existing Bundles</h2>
        <div className="flex flex-col gap-3">
          {bundles.length ? (
            bundles.map((bundle) => (
              <article
                key={bundle.id}
                className="rounded-md border border-ui-border-base p-3 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center gap-2">
                  <div>
                    <h3 className="font-medium">{bundle.title}</h3>
                    <p className="text-ui-fg-subtle text-sm">
                      Discount: {bundle.discount_percentage}% - {bundle.items?.length || 0} items
                    </p>
                    <p className="text-ui-fg-subtle text-sm">
                      Type: {bundle.bundle_type || "general"} · Weight: {bundle.total_weight}g ·
                      Calories: {bundle.total_calories} · P: {bundle.total_protein}g · C:{" "}
                      {bundle.total_carbs}g · F: {bundle.total_fat}g
                    </p>
                    {typeof bundle.total_price === "number" ? (
                      <p className="text-ui-fg-subtle text-sm">
                        Total Price: {formatMoney(bundle.total_price, bundle.currency_code)}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteBundle(bundle.id)}
                    className="rounded-md border border-ui-border-base px-3 py-1"
                  >
                    Delete
                  </button>
                </div>
                <ul className="text-sm text-ui-fg-subtle">
                  {(bundle.items || []).map((item) => (
                    <li key={item.id}>
                      {item.product_title} / {item.variant_title} x {item.quantity}
                    </li>
                  ))}
                </ul>
              </article>
            ))
          ) : (
            <p className="text-ui-fg-subtle">No bundles yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Bundles",
})

export default BundlesPage
