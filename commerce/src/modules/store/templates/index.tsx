import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div data-testid="category-container">
      {/* Full-width banner — background stretches edge-to-edge */}
      <div className="w-full bg-gradient-to-r from-[#F0FDF4] to-[#DCFCE7] py-10 mb-8">
        <div className="content-container flex flex-col gap-y-4">
          <h1
            className="text-4xl font-extrabold text-primary"
            data-testid="store-page-title"
          >
            Curated Bundles
          </h1>
          <p className="text-gray-500">
            Pre-made bundles designed by nutrition experts to match your health
            goals
          </p>
        </div>
      </div>

      {/* Products stay inside the container */}
      <div className="content-container py-6">
        {/* <RefinementList sortBy={sort} /> */}
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
