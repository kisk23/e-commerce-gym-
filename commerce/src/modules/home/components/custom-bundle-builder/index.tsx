"use client"

import { addCustomBundleToCart } from "@lib/data/bundles"
import { Button } from "@medusajs/ui"
import { useMemo, useState } from "react"

type BundleProduct = {
  id: string
  title: string
  variants: {
    id: string
    title: string
  }[]
}

type BundleItemForm = {
  product_id: string
  variant_id: string
  quantity: number
}

type CustomBundleBuilderProps = {
  countryCode: string
  products: BundleProduct[]
}

const createEmptyItem = (): BundleItemForm => ({
  product_id: "",
  variant_id: "",
  quantity: 1,
})

const CustomBundleBuilder = ({ countryCode, products }: CustomBundleBuilderProps) => {
  const [title, setTitle] = useState("My Custom Bundle")
  const [items, setItems] = useState<BundleItemForm[]>([createEmptyItem()])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  )

  const updateItem = (index: number, nextItem: BundleItemForm) => {
    setItems((previousItems) =>
      previousItems.map((item, itemIndex) => (itemIndex === index ? nextItem : item))
    )
  }

  const onSelectProduct = (index: number, productId: string) => {
    const firstVariant = productMap.get(productId)?.variants?.[0]
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

  const onQuantityChange = (index: number, value: string) => {
    const quantity = Math.max(1, Math.round(Number(value) || 1))
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

  const submit = async () => {
    setIsSubmitting(true)
    setMessage(null)

    if (!products.length) {
      setIsSubmitting(false)
      setMessage(
        "No purchasable products are available in this region yet. Ask the admin to add region prices first."
      )
      return
    }

    const sanitizedItems = items
      .filter((item) => !!item.variant_id)
      .map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      }))

    if (!sanitizedItems.length) {
      setIsSubmitting(false)
      setMessage("Please choose at least one product variant.")
      return
    }

    try {
      await addCustomBundleToCart({
        countryCode,
        title,
        items: sanitizedItems,
      })
      setMessage("Custom bundle added to cart.")
      setItems([createEmptyItem()])
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not add custom bundle to cart."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="content-container py-8 flex flex-col gap-4">
      <h1 className="text-2xl-semi">Build Your Custom Bundle</h1>
      <p className="text-ui-fg-subtle">
        Pick products and quantities, then add the whole bundle to your cart.
      </p>
      {!products.length ? (
        <p className="text-ui-fg-subtle">
          No purchasable products are available for this region yet.
        </p>
      ) : null}
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="rounded-md border border-ui-border-base px-3 py-2 max-w-2xl"
        placeholder="Bundle title"
      />
      <div className="flex flex-col gap-3">
        {items.map((item, index) => {
          const variants = productMap.get(item.product_id)?.variants || []

          return (
            <div
              key={`custom-bundle-item-${index}`}
              className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center"
            >
              <select
                value={item.product_id}
                onChange={(event) => onSelectProduct(index, event.target.value)}
                className="rounded-md border border-ui-border-base px-3 py-2"
                disabled={!products.length}
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
                onChange={(event) => onQuantityChange(index, event.target.value)}
                className="rounded-md border border-ui-border-base px-3 py-2"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                className="rounded-md border border-ui-border-base px-3 py-2"
              >
                Remove
              </button>
            </div>
          )
        })}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={addItem}
          className="rounded-md border border-ui-border-base px-4 py-2"
        >
          Add product
        </button>
        <Button
          onClick={submit}
          isLoading={isSubmitting}
          disabled={isSubmitting || !products.length}
        >
          Add Custom Bundle to Cart
        </Button>
      </div>
      {message ? <p className="text-ui-fg-subtle">{message}</p> : null}
    </section>
  )
}

export default CustomBundleBuilder
