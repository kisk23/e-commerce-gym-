import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import BundleCatalog from "@modules/home/components/bundle-catalog"
import { listBundles } from "@lib/data/bundles"
import VegetableCommerce from "@modules/home/components/vegetable-commerce"

export const metadata: Metadata = {
  title: "Bundle Deals",
  description: "Create discounted product bundles and let customers order bundles in one click.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const bundles = await listBundles()

  return (
    <>  
    <Hero />
    
    <VegetableCommerce vegetables={[]} bundles={[]} />
    

      <BundleCatalog bundles={bundles} countryCode={params.countryCode} />
    </>
  )
}
