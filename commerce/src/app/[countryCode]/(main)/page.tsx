import { Metadata } from "next"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import VegetableCommerce from "@modules/home/components/vegetable-commerce"
import {
  Bundle,
  Vegetable,
} from "@modules/home/data/vegetable-commerce"

export const metadata: Metadata = {
  title: "Vegetable Fuel Store",
  description:
    "Vegetable e-commerce with calorie-based bundles, recommendations, and subscriptions.",
}

const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const mapProductToVegetable = (product: any): Vegetable | null => {
  const metadata = (product?.metadata || {}) as Record<string, unknown>
  const isVegetable =
    metadata.is_vegetable === true || metadata.is_vegetable === "true"

  if (!isVegetable) {
    return null
  }

  const firstVariant = product.variants?.[0]
  const amount = firstVariant?.calculated_price?.calculated_amount
  const currencyCode = firstVariant?.calculated_price?.currency_code

  if (typeof amount !== "number" || typeof currencyCode !== "string") {
    return null
  }

  return {
    id: product.handle,
    name: product.title,
    pricePer100g: amount / 100,
    currencyCode,
    caloriesPer100g: toNumber(metadata.calories_per_100g),
    defaultWeightG: toNumber(metadata.default_weight_g, 100),
  }
}

const getBundles = async (): Promise<Bundle[]> => {
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!publishableKey) {
    return []
  }

  try {
    const response = await fetch(`${backendUrl}/store/custom`, {
      headers: {
        "x-publishable-api-key": publishableKey,
      },
      next: {
        revalidate: 30,
      },
    })

    if (!response.ok) {
      return []
    }

    const body = (await response.json()) as { bundles?: Bundle[] }
    return body.bundles || []
  } catch {
    return []
  }
}

const getVegetables = async (regionId: string): Promise<Vegetable[]> => {
  const {
    response: { products },
  } = await listProducts({
    regionId,
    queryParams: {
      limit: 100,
      fields: "id,title,handle,+metadata,*variants.calculated_price",
    },
  })

  return (products || [])
    .map((product) => mapProductToVegetable(product))
    .filter((product): product is Vegetable => !!product)
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    return null
  }

  const [vegetables, bundles] = await Promise.all([
    getVegetables(region.id),
    getBundles(),
  ])

  return <VegetableCommerce vegetables={vegetables} bundles={bundles} />
}
