"use client"

import { addCustomBundleToCart } from "@lib/data/bundles"
import BundleList from "@modules/bundle/components/bundle-list"
import BundleSummary from "@modules/bundle/components/bundle-summary"
import {
  BundleProvider,
  useBundleContext,
} from "@modules/bundle/store/bundle-context"
import {
  BundleFilterOption,
  BundleProductFilters,
  BundleProductPagination,
} from "@modules/bundle/types"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"
import BundleProductControls from "../bundle-product-controls"

type CustomBundleBuilderProps = {
  countryCode: string
  products: HttpTypes.StoreProduct[]
  categories: BundleFilterOption[]
  collections: BundleFilterOption[]
  filters: BundleProductFilters
  pagination: BundleProductPagination
}

const WEIGHT_STEP_G = 100
const MIN_ITEM_WEIGHT_G = 1000
const MIN_ITEM_UNITS = Math.round(MIN_ITEM_WEIGHT_G / WEIGHT_STEP_G)

const BuilderContent = ({
  countryCode,
  products,
  categories,
  collections,
  filters,
  pagination,
}: CustomBundleBuilderProps) => {
  const { items, addItem, clearItems } = useBundleContext()
  const [title, setTitle] = useState("My Custom Bundle")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)

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
    <section className="content-container py-6 sm:py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Build Your Custom Bundle
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Add products from the catalog, adjust quantities, and checkout with
          one bundle line item.
        </p>
      </div>

      {/* Main 2-col layout: [products] [sidebar] */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left: controls + product grid */}
        <div className="min-w-0">
          <BundleProductControls
            categories={categories}
            collections={collections}
            filters={filters}
            pagination={pagination}
            filtration={true}
          />

          <BundleList
            products={products}
            onAdd={({ product, quantity, variantId }) =>
              addItem({ product, quantity, variantId })
            }
          />

          {/* Bottom pagination */}
          <div className="mt-4">
            <BundleProductControls
              categories={categories}
              collections={collections}
              filters={filters}
              pagination={pagination}
              filtration={false}
            />
          </div>
        </div>

        {/* Right: summary sidebar — hidden on mobile, visible xl+ */}
        <div className="hidden xl:block">
          <BundleSummary
            title={title}
            onTitleChange={setTitle}
            onSubmit={submit}
            isSubmitting={isSubmitting}
            message={message}
          />
        </div>
      </div>

      {!products.length ? (
        <p className="mt-4 text-gray-400 text-sm">
          No purchasable products are available for this region yet.
        </p>
      ) : null}

      {items.length > 0 ? (
        <p className="mt-4 text-xs text-gray-400">
          Tip: adding the same variant multiple times will merge weights in the
          summary.
        </p>
      ) : null}

      {/* ── Mobile sticky bottom bar ── */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        {/* Expandable summary drawer */}
        {mobileSummaryOpen && (
          <div className="max-h-[70vh] overflow-y-auto px-4 pt-4 pb-2">
            <BundleSummary
              title={title}
              onTitleChange={setTitle}
              onSubmit={async () => {
                await submit()
                setMobileSummaryOpen(false)
              }}
              isSubmitting={isSubmitting}
              message={message}
            />
          </div>
        )}

        {/* Bottom pill bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button
            onClick={() => setMobileSummaryOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
              {items.length}
            </span>
            {mobileSummaryOpen ? "Hide" : "View"} Bundle
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${mobileSummaryOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          <button
            onClick={submit}
            disabled={isSubmitting || !items.length}
            className="flex-1 max-w-[180px] h-10 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition"
          >
            {isSubmitting ? "Adding…" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Spacer so content isn't hidden behind the sticky bar on mobile */}
      <div className="xl:hidden h-20" aria-hidden="true" />
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
