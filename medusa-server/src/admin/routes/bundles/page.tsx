import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useMemo, useState } from "react"

type AdminProduct = {
  id: string
  title: string
  variants: {
    id: string
    title: string
  }[]
}

type AdminBundle = {
  id: string
  title: string
  description: string | null
  discount_percentage: number
  is_active: boolean
  items: {
    id: string
    product_id: string
    product_title: string
    variant_id: string
    variant_title: string
    quantity: number
  }[]
}

type BundleItemForm = {
  product_id: string
  variant_id: string
  quantity: number
}

const createEmptyItem = (): BundleItemForm => ({
  product_id: "",
  variant_id: "",
  quantity: 1,
})

const BundlesPage = () => {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [bundles, setBundles] = useState<AdminBundle[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [discountPercentage, setDiscountPercentage] = useState(10)
  const [items, setItems] = useState<BundleItemForm[]>([createEmptyItem()])
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
      products?: AdminProduct[]
    }

    const normalizedProducts = (productsBody.products || [])
      .filter((product) => !!product?.id)
      .map((product) => ({
        id: product.id,
        title: product.title || "Untitled product",
        variants: (product.variants || []).filter((variant) => !!variant?.id),
      }))

    setProducts(normalizedProducts)

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

  const onSelectProduct = (index: number, productId: string) => {
    const product = productMap.get(productId)
    const firstVariant = product?.variants?.[0]
    updateItem(index, {
      ...items[index],
      product_id: productId,
      variant_id: firstVariant?.id || "",
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
          discount_percentage: discountPercentage,
          items,
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
          Choose products and variants, then apply one discount to the full bundle.
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
            const selectedProduct = productMap.get(item.product_id)
            const variants = selectedProduct?.variants || []

            return (
              <div
                key={`item-${index}`}
                className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center"
              >
                <select
                  value={item.product_id}
                  onChange={(event) => onSelectProduct(index, event.target.value)}
                  className="rounded-md border border-ui-border-base px-3 py-2"
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
                <select
                  value={item.variant_id}
                  onChange={(event) => onSelectVariant(index, event.target.value)}
                  className="rounded-md border border-ui-border-base px-3 py-2"
                  disabled={!item.product_id}
                >
                  <option value="">Select variant</option>
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.title}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) => onChangeQuantity(index, event.target.value)}
                  className="rounded-md border border-ui-border-base px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded-md border border-ui-border-base px-3 py-2"
                  disabled={items.length === 1}
                >
                  Remove
                </button>
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
