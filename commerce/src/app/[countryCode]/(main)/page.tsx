import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import BundleCatalog from "@modules/home/components/bundle-catalog"
import { listBundles } from "@lib/data/bundles"
// import VegetableCommerce from "@modules/home/components/vegetable-commerce"
import { getRegion } from "@lib/data/regions"
import BundleRecommender from "@modules/home/components/bundle-recommendation"
import FreshPopular from "@/modules/home/components/fresh-popular"
import WhyComponent from "@/modules/home/components/why-component"

export const metadata: Metadata = {
  title: "Bundle Deals",
  description:
    "Create discounted product bundles and let customers order bundles in one click.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const bundles = await listBundles()
  const region = await getRegion(params.countryCode)
  const currencyCode = region?.currency_code || "aed"
  if (!region) {
  throw new Error("Region not found")
}

  return (
    <>
      <Hero />
      <FreshPopular collection={null} region={region} />
      <WhyComponent />

      {/* <VegetableCommerce vegetables={[]} bundles={[]} /> */}
      <BundleRecommender
        bundles={bundles}
        countryCode={params.countryCode}
        currencyCode={currencyCode}
      />

      <BundleCatalog
        bundles={bundles}
        countryCode={params.countryCode}
        currencyCode={currencyCode}
      />
    </>
  )
}
