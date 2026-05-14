"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import BundleCard, { BundleCardAddPayload } from "../bundle-card"

type BundleListProps = {
  products: HttpTypes.StoreProduct[]
  onAdd?: (_payload: BundleCardAddPayload) => void
}

const PRODUCTS_PER_PAGE = 9

export default function BundleList({ products, onAdd }: BundleListProps) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE))
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    setPage(1)
  }, [products])

  const visibleProducts = useMemo(() => {
    const start = (safePage - 1) * PRODUCTS_PER_PAGE
    return products.slice(start, start + PRODUCTS_PER_PAGE)
  }, [products, safePage])

  if (!products.length) {
    return (
      <div className="rounded-lg border border-ui-border-base p-6 text-ui-fg-subtle">
        No products are available for bundle creation in this region yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6" data-testid="bundle-builder-list">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleProducts.map((product) => (
          <li key={product.id} data-testid="bundle-builder-product">
            <BundleCard product={product} onAdd={onAdd} />
          </li>
        ))}
      </ul>

      {totalPages > 1 ? (
        <nav
          aria-label="Bundle builder products"
          className="flex flex-wrap items-center justify-center gap-2"
          data-testid="bundle-builder-pagination"
        >
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage === 1}
            className="h-9 min-w-20 rounded-md border border-ui-border-base px-3 text-sm font-medium text-ui-fg-base disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="bundle-builder-pagination-prev"
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
                className={clx(
                  "h-9 w-9 rounded-md border text-sm font-medium",
                  pageNumber === safePage
                    ? "border-ui-fg-base bg-ui-fg-base text-ui-bg-base"
                    : "border-ui-border-base text-ui-fg-base"
                )}
                data-testid={`bundle-builder-pagination-page-${pageNumber}`}
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
            data-testid="bundle-builder-pagination-next"
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  )
}
