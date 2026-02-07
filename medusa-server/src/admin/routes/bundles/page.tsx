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

type ValidationError = {
  field: string
  message: string
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
  const [errors, setErrors] = useState<ValidationError[]>([])
  
  // Edit mode state
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null)
  const [deletedProductWarnings, setDeletedProductWarnings] = useState<Map<string, string[]>>(new Map())

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  )

  const validateForm = (): ValidationError[] => {
    const validationErrors: ValidationError[] = []

    if (!title.trim()) {
      validationErrors.push({ field: "title", message: "Title is required" })
    }

    if (items.length === 0) {
      validationErrors.push({ field: "items", message: "At least one item is required" })
    }

    items.forEach((item, index) => {
      if (!item.product_id) {
        validationErrors.push({
          field: `items[${index}].product_id`,
          message: `Item ${index + 1}: Product is required`,
        })
      }
      if (!item.variant_id) {
        validationErrors.push({
          field: `items[${index}].variant_id`,
          message: `Item ${index + 1}: Variant is required`,
        })
      }
      if (item.quantity < 1) {
        validationErrors.push({
          field: `items[${index}].quantity`,
          message: `Item ${index + 1}: Quantity must be at least 1`,
        })
      }
      if (item.weight <= 0) {
        validationErrors.push({
          field: `items[${index}].weight`,
          message: `Item ${index + 1}: Weight must be greater than 0`,
        })
      }

      // Check if product still exists
      const product = productMap.get(item.product_id)
      if (item.product_id && !product) {
        validationErrors.push({
          field: `items[${index}].product_id`,
          message: `Item ${index + 1}: Selected product no longer exists`,
        })
      } else if (product && item.variant_id) {
        // Check if variant still exists
        const variant = product.variants.find((v) => v.id === item.variant_id)
        if (!variant) {
          validationErrors.push({
            field: `items[${index}].variant_id`,
            message: `Item ${index + 1}: Selected variant no longer exists`,
          })
        }
      }
    })

    return validationErrors
  }

  const checkBundleProductsExist = (bundle: AdminBundle): string[] => {
    const warnings: string[] = []
    
    bundle.items.forEach((item) => {
      const product = productMap.get(item.product_id)
      if (!product) {
        warnings.push(`Product "${item.product_title}" no longer exists`)
      } else {
        const variant = product.variants.find((v) => v.id === item.variant_id)
        if (!variant) {
          warnings.push(`Variant "${item.variant_title}" of "${item.product_title}" no longer exists`)
        }
      }
    })

    return warnings
  }

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

    const loadedBundles = bundlesBody.bundles || []
    setBundles(loadedBundles)

    // Check for deleted products in existing bundles
    const warningsMap = new Map<string, string[]>()
    loadedBundles.forEach((bundle) => {
      const warnings = checkBundleProductsExist(bundle)
      if (warnings.length > 0) {
        warningsMap.set(bundle.id, warnings)
      }
    })
    setDeletedProductWarnings(warningsMap)
  }

  useEffect(() => {
    loadData().catch(() => {
      setMessage("Could not load bundles data.")
    })
  }, [])

  // Re-check product existence when products change
  useEffect(() => {
    if (bundles.length > 0 && products.length > 0) {
      const warningsMap = new Map<string, string[]>()
      bundles.forEach((bundle) => {
        const warnings = checkBundleProductsExist(bundle)
        if (warnings.length > 0) {
          warningsMap.set(bundle.id, warnings)
        }
      })
      setDeletedProductWarnings(warningsMap)
    }
  }, [products, bundles])

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

  const bundleDiscountedPrice = useMemo(() => {
    const discount = discountPercentage / 100
    const discounted = bundleTotalPrice * (1 - discount)
    return roundValue(discounted)
  }, [bundleTotalPrice, discountPercentage])

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

  const onSelectVariant = (index: number, variantId: string) => {
    updateItem(index, {
      ...items[index],
      variant_id: variantId,
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

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setBundleType("bulk")
    setDiscountPercentage(10)
    setItems([createEmptyItem()])
    setEditingBundleId(null)
    setErrors([])
  }

  const createBundle = async () => {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setMessage("Please fix the validation errors below.")
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    setErrors([])

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

      resetForm()
      setMessage("Bundle created successfully.")
      await loadData()
    } catch {
      setMessage("Could not create bundle.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateBundle = async () => {
    if (!editingBundleId) return

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setMessage("Please fix the validation errors below.")
      return
    }

    setIsSubmitting(true)
    setMessage(null)
    setErrors([])

    try {
      const response = await fetch(`/admin/bundles/${editingBundleId}`, {
        method: "PUT",
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
        setMessage(body?.message || "Could not update bundle.")
        return
      }

      resetForm()
      setMessage("Bundle updated successfully.")
      await loadData()
    } catch {
      setMessage("Could not update bundle.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const editBundle = (bundle: AdminBundle) => {
    setTitle(bundle.title)
    setDescription(bundle.description || "")
    setBundleType(bundle.bundle_type || "bulk")
    setDiscountPercentage(bundle.discount_percentage)
    setEditingBundleId(bundle.id)
    
    const bundleItems: BundleItemForm[] = bundle.items.map((item) => {
      const product = productMap.get(item.product_id)
      return {
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        weight: item.weight,
        nutrition_per_100g: product?.nutrition_per_100g || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      }
    })
    
    setItems(bundleItems.length > 0 ? bundleItems : [createEmptyItem()])
    setErrors([])
    setMessage(null)

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const deleteBundle = async (bundleId: string) => {
    if (!confirm("Are you sure you want to delete this bundle?")) {
      return
    }

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
        <h1 className="text-xl font-semibold mb-2">
          {editingBundleId ? "Edit Product Bundle" : "Create Product Bundle"}
        </h1>
        <p className="text-ui-fg-subtle mb-4">
          Nutrition totals are auto-calculated from product per-100g data and weight.
        </p>

        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
            <h3 className="text-sm font-semibold text-red-800 mb-2">Validation Errors:</h3>
            <ul className="list-disc list-inside text-sm text-red-700">
              {errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          <input
            placeholder="Bundle title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={`rounded-md border px-3 py-2 ${
              errors.some((e) => e.field === "title")
                ? "border-red-500"
                : "border-ui-border-base"
            }`}
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
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ui-fg-subtle">
              Discount Percentage (1-99%)
            </label>
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
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {items.map((item, index) => {
            const calculatedNutrition = getCalculatedNutrition(item)
            const product = productMap.get(item.product_id)
            const availableVariants = product?.variants || []
            const hasProductError = errors.some((e) => e.field === `items[${index}].product_id`)
            const hasVariantError = errors.some((e) => e.field === `items[${index}].variant_id`)

            return (
              <div key={`item-${index}`} className="flex flex-col gap-2 p-3 rounded-md border border-ui-border-base bg-ui-bg-subtle">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                  <label className="flex flex-col gap-1 text-xs text-ui-fg-subtle">
                    Product
                    <select
                      value={item.product_id}
                      onChange={(event) => onSelectProduct(index, event.target.value)}
                      className={`rounded-md border px-3 py-2 text-sm text-ui-fg-base ${
                        hasProductError ? "border-red-500" : "border-ui-border-base"
                      }`}
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
                    Variant
                    <select
                      value={item.variant_id}
                      onChange={(event) => onSelectVariant(index, event.target.value)}
                      disabled={!item.product_id || availableVariants.length === 0}
                      className={`rounded-md border px-3 py-2 text-sm text-ui-fg-base ${
                        hasVariantError ? "border-red-500" : "border-ui-border-base"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="">Select variant</option>
                      {availableVariants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.title}
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
                    className="rounded-md border border-ui-border-base px-3 py-2 hover:bg-ui-bg-base disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-disabled"
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
                      className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-disabled"
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
                      className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-disabled"
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
                      className="rounded-md border border-ui-border-base px-3 py-2 text-sm text-ui-fg-base bg-ui-bg-disabled"
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
            className="rounded-md border border-ui-border-base px-4 py-2 hover:bg-ui-bg-base"
          >
            Add product
          </button>
          {editingBundleId ? (
            <>
              <button
                type="button"
                onClick={updateBundle}
                disabled={isSubmitting}
                className="rounded-md bg-ui-bg-interactive text-ui-fg-on-color px-4 py-2 disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Update bundle"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="rounded-md border border-ui-border-base px-4 py-2 hover:bg-ui-bg-base disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={createBundle}
              disabled={isSubmitting}
              className="rounded-md bg-ui-bg-interactive text-ui-fg-on-color px-4 py-2 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create bundle"}
            </button>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <p className="text-ui-fg-subtle text-sm">
            Original Price: {formatMoney(bundleTotalPrice, currencyCode)}
          </p>
          <p className="text-ui-fg-base text-base font-semibold">
            Discounted Price ({discountPercentage}% off): {formatMoney(bundleDiscountedPrice, currencyCode)}
          </p>
          <p className="text-green-600 text-sm">
            Savings: {formatMoney(bundleTotalPrice - bundleDiscountedPrice, currencyCode)}
          </p>
        </div>

        {message ? (
          <p className={`mt-3 ${message.includes("success") ? "text-green-600" : "text-ui-fg-subtle"}`}>
            {message}
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-ui-border-base p-4 bg-ui-bg-base">
        <h2 className="text-lg font-semibold mb-3">Existing Bundles</h2>
        <div className="flex flex-col gap-3">
          {bundles.length ? (
            bundles.map((bundle) => {
              const warnings = deletedProductWarnings.get(bundle.id) || []
              const hasWarnings = warnings.length > 0

              return (
                <article
                  key={bundle.id}
                  className={`rounded-md border p-3 flex flex-col gap-2 ${
                    hasWarnings
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-ui-border-base"
                  }`}
                >
                  {hasWarnings && (
                    <div className="mb-2 p-2 rounded-md bg-yellow-100 border border-yellow-300">
                      <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                        ⚠️ Product Availability Issues:
                      </h4>
                      <ul className="list-disc list-inside text-xs text-yellow-800">
                        {warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <h3 className="font-medium">{bundle.title}</h3>
                      {bundle.description && (
                        <p className="text-ui-fg-subtle text-sm mt-1">{bundle.description}</p>
                      )}
                      <p className="text-ui-fg-subtle text-sm mt-1">
                        Discount: {bundle.discount_percentage}% - {bundle.items?.length || 0} items
                      </p>
                      <p className="text-ui-fg-subtle text-sm">
                        Type: {bundle.bundle_type || "general"} · Weight: {bundle.total_weight}g ·
                        Calories: {bundle.total_calories} · P: {bundle.total_protein}g · C:{" "}
                        {bundle.total_carbs}g · F: {bundle.total_fat}g
                      </p>
                      {typeof bundle.total_price === "number" ? (
                        <p className="text-ui-fg-base text-sm font-semibold mt-1">
                          Price: {formatMoney(bundle.total_price, bundle.currency_code)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editBundle(bundle)}
                        className="rounded-md border border-ui-border-base px-3 py-1 hover:bg-ui-bg-base text-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBundle(bundle.id)}
                        className="rounded-md border border-red-300 bg-red-50 text-red-700 px-3 py-1 hover:bg-red-100 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <ul className="text-sm text-ui-fg-subtle">
                    {(bundle.items || []).map((item) => (
                      <li key={item.id}>
                        {item.product_title} / {item.variant_title} x {item.quantity} ({item.weight}g)
                      </li>
                    ))}
                  </ul>
                </article>
              )
            })
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