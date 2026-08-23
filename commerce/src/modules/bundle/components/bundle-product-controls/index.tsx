"use client"

import {
  BundleFilterOption,
  BundleProductFilters,
  BundleProductPagination,
  BundleProductSort,
} from "@modules/bundle/types"
import { clx } from "@medusajs/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useMemo, useState, useTransition } from "react"

type BundleProductControlsProps = {
  categories: BundleFilterOption[]
  collections: BundleFilterOption[]
  filters: BundleProductFilters
  pagination: BundleProductPagination
  filtration?: boolean
}

const sortOptions: { value: BundleProductSort; label: string }[] = [
  { value: "created_at", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "title_asc", label: "Name: A to Z" },
  { value: "title_desc", label: "Name: Z to A" },
]

const getPageWindow = (currentPage: number, totalPages: number) => {
  const maxVisiblePages = 5
  const halfWindow = Math.floor(maxVisiblePages / 2)
  const start = Math.max(
    1,
    Math.min(currentPage - halfWindow, totalPages - maxVisiblePages + 1)
  )
  const end = Math.min(totalPages, start + maxVisiblePages - 1)

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export default function BundleProductControls({
  categories,
  collections,
  filters,
  pagination,
  filtration,
}: BundleProductControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(filters.q)

  const totalPages = Math.max(1, Math.ceil(pagination.count / pagination.limit))
  const safePage = Math.min(Math.max(pagination.page, 1), totalPages)
  const visiblePages = useMemo(
    () => getPageWindow(safePage, totalPages),
    [safePage, totalPages]
  )

  const pushParams = (
    updates: Record<string, string | null>,
    options: { resetPage?: boolean } = {}
  ) => {
    const params = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        params.delete(key)
        return
      }

      params.set(key, value)
    })

    if (options.resetPage) {
      params.delete("page")
    }

    const query = params.toString()

    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    pushParams({ q: searchValue.trim() || null }, { resetPage: true })
  }

  const clearFilters = () => {
    setSearchValue("")
    pushParams({
      q: null,
      category_id: null,
      collection_id: null,
      tag_id: null,
      type_id: null,
      sortBy: null,
      page: null,
    })
  }

  const goToPage = (page: number) => {
    pushParams({ page: page > 1 ? String(page) : null })
  }

  const resultLabel =
    pagination.count === 1
      ? "1 product"
      : `${pagination.count.toLocaleString()} products`

  const showCategoryFilter = categories.length > 0

  return (
    <div className="flex flex-col gap-4 mb-6">
      {filtration ? (
        <div
          className={clx(
            "grid grid-cols-1 md:grid-cols-2 gap-3 items-end",
            showCategoryFilter
              ? "lg:grid-cols-[1fr_180px_180px_160px_auto]"
              : "lg:grid-cols-[1fr_180px_160px_auto]"
          )}
        >
        <form onSubmit={submitSearch} className="flex flex-col gap-1.5">
          <label
            htmlFor="bundle-product-search"
            className="text-sm font-medium"
          >
            Search
          </label>
          <div className="flex gap-2">
            <input
              id="bundle-product-search"
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search products"
              className="h-10 w-full rounded-md border border-ui-border-base px-3 text-sm outline-none focus:border-ui-fg-base"
            />
            <button
              type="submit"
              className="h-10 rounded-md bg-ui-fg-base px-4 text-sm font-medium text-ui-bg-base disabled:opacity-50"
              disabled={isPending}
            >
              Apply
            </button>
          </div>
        </form>

        {showCategoryFilter && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Category
            <select
              value={filters.categoryId}
              onChange={(event) =>
                pushParams(
                  { category_id: event.target.value || null },
                  { resetPage: true }
                )
              }
              className="h-10 rounded-md border border-ui-border-base bg-white px-3 text-sm outline-none focus:border-ui-fg-base"
              disabled={isPending}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* <label className="flex flex-col gap-1.5 text-sm font-medium">
          Collection
          <select
            value={filters.collectionId}
            onChange={(event) =>
              pushParams(
                { collection_id: event.target.value || null },
                { resetPage: true }
              )
            }
            className="h-10 rounded-md border border-ui-border-base bg-white px-3 text-sm outline-none focus:border-ui-fg-base"
            disabled={isPending}
          >
            <option value="">All collections</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.label}
              </option>
            ))}
          </select>
        </label> */}

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Sort
          <select
            value={filters.sortBy}
            onChange={(event) =>
              pushParams(
                { sortBy: event.target.value || null },
                { resetPage: true }
              )
            }
            className="h-10 rounded-md border border-ui-border-base bg-white px-3 text-sm outline-none focus:border-ui-fg-base"
            disabled={isPending}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={clearFilters}
          className="h-10 rounded-md bg-red-500 hover:bg-red-600 border border-ui-border-base px-4 text-sm font-medium text-white disabled:opacity-50"
          disabled={isPending}
        >
          Clear
        </button>
      </div>
      ):<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
        <p className="text-sm text-ui-fg-subtle">
          Showing page {safePage} of {totalPages} for {resultLabel}
        </p>

        {totalPages > 1 ? (
          <nav
            aria-label="Bundle builder products"
            className="flex flex-wrap items-center gap-2"
            data-testid="bundle-builder-pagination"
          >
            <button
              type="button"
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1 || isPending}
              className="h-9 min-w-20 rounded-md border border-ui-border-base px-3 text-sm font-medium text-ui-fg-base disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="bundle-builder-pagination-prev"
            >
              Previous
            </button>

            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => goToPage(pageNumber)}
                disabled={isPending}
                aria-current={pageNumber === safePage ? "page" : undefined}
                className={clx(
                  "h-9 w-9 rounded-md border text-sm font-medium disabled:opacity-50",
                  pageNumber === safePage
                    ? "border-ui-fg-base bg-ui-fg-base text-ui-bg-base"
                    : "border-ui-border-base text-ui-fg-base"
                )}
                data-testid={`bundle-builder-pagination-page-${pageNumber}`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goToPage(safePage + 1)}
              disabled={
                !pagination.nextPage || safePage === totalPages || isPending
              }
              className="h-9 min-w-20 rounded-md border border-ui-border-base px-3 text-sm font-medium text-ui-fg-base disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="bundle-builder-pagination-next"
            >
              Next
            </button>
          </nav>
        ) : null}
      </div>}
    </div>
  )
}
