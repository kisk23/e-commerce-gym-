"use client"

import { addCustomBundleToCart } from "@lib/data/bundles"
import BundleList from "@modules/bundle/components/bundle-list"
import BundleSummary from "@modules/bundle/components/bundle-summary"
import {
  BundleProvider,
  useBundleContext,
} from "@modules/bundle/store/bundle-context"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"

type CustomBundleBuilderProps = {
  countryCode: string
  products: HttpTypes.StoreProduct[]
}

const WEIGHT_STEP_G = 100
const MIN_ITEM_WEIGHT_G = 1000
const MIN_ITEM_UNITS = Math.round(MIN_ITEM_WEIGHT_G / WEIGHT_STEP_G)

const BuilderContent = ({
  countryCode,
  products,
}: CustomBundleBuilderProps) => {
  const { items, addItem, clearItems } = useBundleContext()
  const [title, setTitle] = useState("My Custom Bundle")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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

    if (!items.length) {
      setIsSubmitting(false)
      setMessage("Please add at least one item to your bundle.")
      return
    }

    const sanitizedItems = items
      .filter((item) => !!item.variantId)
      .map((item) => ({
        variant_id: item.variantId,
        quantity: Math.max(
          MIN_ITEM_UNITS,
          Math.round(
            (Number(item.quantity) || MIN_ITEM_WEIGHT_G) / WEIGHT_STEP_G
          )
        ),
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
      setTitle("My Custom Bundle")
      clearItems()
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
    <section className="content-container py-8">
      <div className="mb-6">
        <h1 className="text-2xl-semi">Build Your Custom Bundle</h1>
        <p className="text-ui-fg-subtle mt-1">
          Add products from the catalog, adjust quantities, and checkout with
          one bundle line item.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        <BundleList
          products={products}
          onAdd={({ product, quantity, variantId }) =>
            addItem({ product, quantity, variantId })
          }
        />

        <BundleSummary
          title={title}
          onTitleChange={setTitle}
          onSubmit={submit}
          isSubmitting={isSubmitting}
          message={message}
        />
      </div>

      {!products.length ? (
        <p className="mt-4 text-ui-fg-subtle">
          No purchasable products are available for this region yet.
        </p>
      ) : null}

      {items.length > 0 ? (
        <p className="mt-4 text-sm text-ui-fg-subtle">
          Tip: adding the same variant multiple times will merge weights in the
          summary.
        </p>
      ) : null}
    </section>
  )
}

const CustomBundleBuilder = (props: CustomBundleBuilderProps) => {
  return (
    <BundleProvider>
      <BuilderContent {...props} />
    </BundleProvider>
  )
}

export default CustomBundleBuilder
