import { listBundles } from "@lib/data/bundles"
import { getRegion } from "@lib/data/regions"
import BundleGrid from "@/modules/bundle/components/bundle-grid/bundle-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Fetch bundles instead of generic products
  const bundles = await listBundles()
  return <BundleGrid bundles={bundles} countryCode={countryCode} />
}
