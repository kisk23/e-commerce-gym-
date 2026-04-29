import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Bundles",
  description: "Explore all of our bundles.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function BundlesPage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      // =======
      // import { listBundles } from "@lib/data/bundles"
      // import { getRegion } from "@lib/data/regions"
      // import BundleCatalog from "@modules/bundle/components/bundle-catalog-popup"
      // import { Metadata } from "next"

      // export const metadata: Metadata = {
      //   title: "Bundles",
      //   description: "Browse curated bundles and add them directly to your cart.",
      // }

      // export default async function BundlesPage(props: {
      //   params: Promise<{ countryCode: string }>
      // }) {
      //   const params = await props.params
      //   const region = await getRegion(params.countryCode)

      //   if (!region) {
      //     throw new Error("Region not found")
      //   }

      //   const bundles = await listBundles()

      //   return (
      //     <BundleCatalog
      //       bundles={bundles}
      //       countryCode={params.countryCode}
      //       currencyCode={region.currency_code || "aed"}
      // >>>>>>> b307fe7 (feat(bundle): implement bundle card with quantity, pricing, and nutrition logic)
    />
  )
}
