"use client"

import { useState, useMemo } from "react"
import { StoreBundle } from "@lib/types/bundle"
import BundleView from "@/modules/bundle/components/bundle-view"
import { Funnel } from "@medusajs/icons"
import { addBundleToCart } from "@lib/data/bundles"

const BUNDLES_PER_PAGE = 9

export default function BundleGrid({
  bundles,
  countryCode,
}: {
  bundles: StoreBundle[]
  countryCode: string
}) {
  const [activeFilter, setActiveFilter] = useState("All Bundles")
  const [page, setPage] = useState(1)
  const [isAddingId, setIsAddingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Dynamically extract unique bundle types from the fetched bundles
  const filters = useMemo(() => {
    const types = new Set(
      bundles
        .map((b) => b.bundle_type)
        .filter(
          (type): type is string =>
            typeof type === "string" && type.trim().length > 0
        )
    )
    return ["All Bundles", ...Array.from(types)]
  }, [bundles])

  const filteredBundles =
    activeFilter === "All Bundles"
      ? bundles
      : bundles.filter((b) => {
          // the bundle_type might be formatted differently or lowercase in the DB
          // so we do a case-insensitive comparison
          return b.bundle_type?.toLowerCase() === activeFilter.toLowerCase()
        })

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBundles.length / BUNDLES_PER_PAGE)
  )
  const safePage = Math.min(page, totalPages)
  const visibleBundles = filteredBundles.slice(
    (safePage - 1) * BUNDLES_PER_PAGE,
    safePage * BUNDLES_PER_PAGE
  )
  const visibleStart =
    filteredBundles.length > 0 ? (safePage - 1) * BUNDLES_PER_PAGE + 1 : 0
  const visibleEnd = Math.min(safePage * BUNDLES_PER_PAGE, filteredBundles.length)

  const addBundleItemsToCart = async (bundle: StoreBundle) => {
    if (!bundle.items?.length) {
      setMessage("This bundle has no items to add.")
      return
    }

    setIsAddingId(bundle.id)
    setMessage(null)

    try {
      await addBundleToCart({ bundleId: bundle.id, countryCode })
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
              onClick={() => {
                setActiveFilter(filter)
                setPage(1)
              }}
              className={`px-6 py-2 border border-gray-200 rounded-md text-sm font-semibold transition-colors ${
                activeFilter === filter
                  ? "bg-primary text-white"
                  : "hover:bg-gray-200"
              }`}
              data-testid={`bundle-filter-${filter
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* showing products count */}
      <div className="text-lg text-gray-500 my-6" data-testid="bundle-count">
        Showing {visibleStart} - {visibleEnd} of {filteredBundles.length} bundles
      </div>

      {/* products grid */}
      <ul
        className="grid grid-cols-1 w-full sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 justify-items-center"
        data-testid="bundles-list"
      >
        {visibleBundles.map((bundle) => {
          return (
            <li key={bundle.id} data-testid="bundle-card">
              <BundleView
                bundle={bundle}
                onAddToCart={() => addBundleItemsToCart(bundle)}
                isAdding={isAddingId === bundle.id}
              />
            </li>
          )
        })}
      </ul>

      {totalPages > 1 ? (
        <nav
          aria-label="Bundles"
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
          data-testid="bundles-pagination"
        >
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage === 1}
            className="h-9 min-w-20 rounded-md border border-ui-border-base px-3 text-sm font-medium text-ui-fg-base disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="bundles-pagination-prev"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                aria-current={pageNumber === safePage ? "page" : undefined}
                className={`h-9 w-9 rounded-md border text-sm font-medium ${
                  pageNumber === safePage
                    ? "border-ui-fg-base bg-ui-fg-base text-ui-bg-base"
                    : "border-ui-border-base text-ui-fg-base"
                }`}
                data-testid={`bundles-pagination-page-${pageNumber}`}
              >
                {pageNumber}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={safePage === totalPages}
            className="h-9 min-w-20 rounded-md border border-ui-border-base px-3 text-sm font-medium text-ui-fg-base disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="bundles-pagination-next"
          >
            Next
          </button>
        </nav>
      ) : null}

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
