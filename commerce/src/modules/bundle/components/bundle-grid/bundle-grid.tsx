"use client"

import { useState, useMemo } from "react"
import { StoreBundle } from "@lib/types/bundle"
import BundleView from "@/modules/bundle/components/bundle-view"
import { Funnel } from "@medusajs/icons"
import { addToCart } from "@lib/data/cart"

export default function BundleGrid({
  bundles,
  countryCode,
}: {
  bundles: StoreBundle[]
  countryCode: string
}) {
  const [activeFilter, setActiveFilter] = useState("All Bundles")
  const [isAddingId, setIsAddingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Dynamically extract unique bundle types from the fetched bundles
  const filters = useMemo(() => {
    const types = new Set(
      bundles
        .map((b) => b.bundle_type)
        .filter((type): type is string => typeof type === "string" && type.trim().length > 0)
    )
    return ["All Bundles", ...Array.from(types)]
  }, [bundles])

  const filteredBundles = activeFilter === "All Bundles"
    ? bundles
    : bundles.filter(b => {
        // the bundle_type might be formatted differently or lowercase in the DB
        // so we do a case-insensitive comparison
        return b.bundle_type?.toLowerCase() === activeFilter.toLowerCase()
      })

  const addBundleItemsToCart = async (bundle: StoreBundle) => {
    if (!bundle.items?.length) {
      setMessage("This bundle has no items to add.")
      return
    }

    setIsAddingId(bundle.id)
    setMessage(null)

    const operationId = `bundle_${Date.now()}`

    try {
      for (const item of bundle.items) {
        if (!item.variant_id) {
          continue
        }

        await addToCart({
          variantId: item.variant_id,
          quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
          countryCode,
          metadata: {
            bundle_id: bundle.id,
            bundle_title: bundle.title,
            bundle_discount_percentage: Math.max(
              0,
              Math.round(Number(bundle.discount_percentage || 0))
            ),
            bundle_operation_id: operationId,
            bundle_type: "admin",
            ...(typeof item.weight === "number" && item.weight > 0
              ? { bundle_item_weight: item.weight, weight_g: item.weight }
              : {}),
          },
        })
      }

      setMessage(`Added "${bundle.title}" to cart.`)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not add bundle to cart."
      )
    } finally {
      setIsAddingId(null)
    }
  }

  return (
    <>
      {/* filter section */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full my-6">
        <div className="flex items-center">
          <Funnel color="#717182" />
          <p className="text-[#717182] ms-1 font-medium">Filter:</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 border border-gray-200 rounded-md text-sm font-semibold transition-colors ${
                activeFilter === filter
                  ? "bg-primary text-white"
                  : "hover:bg-gray-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* showing products count */}
      <div className="text-lg text-gray-500 my-6">
        Showing {filteredBundles.length > 0 ? 1 : 0} - {filteredBundles.length} of {bundles.length} bundles
      </div>

      {/* products grid */}
      <ul
        className="grid grid-cols-1 w-full sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 justify-items-center"
        data-testid="products-list"
      >
        {filteredBundles.map((bundle) => {
          return (
            <li key={bundle.id}>
              <BundleView
                bundle={bundle}
                onAddToCart={() => addBundleItemsToCart(bundle)}
                isAdding={isAddingId === bundle.id}
              />
            </li>
          )
        })}
      </ul>

      {message ? (
        <p className="mt-4 text-sm text-ui-fg-subtle" role="status">
          {message}
        </p>
      ) : null}
      {bundles.length === 0 && (
        <div className="text-center w-full py-12 text-gray-500">
          No bundles found.
        </div>
      )}
    </>
  )
}

