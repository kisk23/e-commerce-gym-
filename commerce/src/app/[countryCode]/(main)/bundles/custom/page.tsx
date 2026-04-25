import { Metadata } from "next"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import CustomBundleBuilder from "@modules/home/components/custom-bundle-builder"

export const metadata: Metadata = {
  title: "Custom Bundle Builder",
  description:
    "Create your own bundle from products and add it to cart in one click.",
}

export default async function CustomBundlePage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  const headers = {
    ...(await getAuthHeaders()),
  }

  const { products } = region
    ? await sdk.client
        .fetch<{ products: HttpTypes.StoreProduct[] }>("/store/products", {
          method: "GET",
          query: {
            region_id: region.id,
            limit: 100,
            fields:
              "id,title,thumbnail,*variants.id,*variants.title,*variants.calculated_price",
          },
          headers,
          cache: "no-store",
        })
        .catch(() => ({ products: [] }))
    : { products: [] }

  const hasCalculatedAmount = (variant: {
    calculated_price?: { calculated_amount?: number | string | null } | null
  }) => {
    const amount = variant.calculated_price?.calculated_amount

    if (typeof amount === "number") {
      return Number.isFinite(amount)
    }

    if (typeof amount === "string") {
      const parsed = Number(amount)
      return Number.isFinite(parsed)
    }

    return false
  }

  const bundleProducts = (products || [])
    .map((product) => ({
      id: product.id,
      title: product.title || "Untitled product",
      variants: (product.variants || [])
        .filter((variant) => hasCalculatedAmount(variant))
        .map((variant) => ({
          id: variant.id,
          title: variant.title || "Default",
        }))
        .filter((variant) => !!variant.id),
    }))
    .filter((product) => product.variants.length > 0)

  return (
    <CustomBundleBuilder
      countryCode={params.countryCode}
      products={bundleProducts}
    />
  )
}
