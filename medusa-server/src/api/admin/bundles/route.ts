import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { BUNDLE_MODULE } from "../../../modules/bundle"
import { calculateBundleTotals, normalizeBundleInput } from "./utils"
import { IProductModuleService } from "@medusajs/types"

type ProductQueryResponse = {
  data: {
    id: string
    title: string
    thumbnail: string | null
    metadata?: Record<string, unknown> | null
    variants?: {
      id: string
      title: string
      price_set?: {
        prices?: {
          amount: number
          currency_code: string
          price_list_id?: string | null
        }[]
      } | null
    }[]
  }[]
}

type StoreQueryResponse = {
  data: {
    id: string
    supported_currencies?: {
      currency_code?: string | null
      is_default?: boolean | null
    }[] | null
  }[]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const bundles = await bundleModuleService.listBundles(
    {},
    {
      relations: ["items"],
    }
  )

  const storeResult: StoreQueryResponse = await query.graph({
    entity: "store",
    fields: ["id", "supported_currencies.currency_code", "supported_currencies.is_default"],
  })
  const supportedCurrencies =
    (storeResult.data || [])[0]?.supported_currencies || []
  const defaultCurrency =
    supportedCurrencies.find((currency) => currency?.is_default)?.currency_code ||
    supportedCurrencies.find((currency) => currency?.currency_code)?.currency_code ||
    "aed"

  res.status(200).json({
    bundles: (bundles || []).map((bundle) => ({
      ...bundle,
      currency_code: defaultCurrency,
    })),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
  const payload = req.body || {}
  const inputItems = Array.isArray((payload as { items?: unknown[] }).items)
    ? ((payload as { items: { product_id?: string }[] }).items || [])
    : []
  const productIds = Array.from(
    new Set(
      inputItems
        .map((item) => item.product_id)
        .filter((id): id is string => typeof id === "string" && !!id)
    )
  )

  const productsResult: ProductQueryResponse = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "thumbnail",
      "metadata",
      "variants.id",
      "variants.title",
      "variants.price_set.prices.amount",
      "variants.price_set.prices.currency_code",
      "variants.price_set.prices.price_list_id",
    ],
    filters: {
      id: productIds,
    },
  })

  const storeResult: StoreQueryResponse = await query.graph({
    entity: "store",
    fields: ["id", "supported_currencies.currency_code", "supported_currencies.is_default"],
  })
  const supportedCurrencies =
    (storeResult.data || [])[0]?.supported_currencies || []
  const defaultCurrency =
    supportedCurrencies.find((currency) => currency?.is_default)?.currency_code ||
    supportedCurrencies.find((currency) => currency?.currency_code)?.currency_code ||
    null

  const normalized = normalizeBundleInput(
    payload as Record<string, unknown>,
    productsResult.data || [],
    defaultCurrency
  )
  const totals = calculateBundleTotals(normalized.items)

  const productMetadataMap = new Map(
    (productsResult.data || []).map((product) => [
      product.id,
      product.metadata || {},
    ])
  )
  const nutritionUpdates = new Map<
    string,
    (typeof normalized.items)[number]["nutrition_per_100g"]
  >()

  normalized.items.forEach((item) => {
    if (item.nutrition_source === "input") {
      nutritionUpdates.set(item.product_id, item.nutrition_per_100g)
    }
  })

  if (nutritionUpdates.size) {
    await Promise.all(
      Array.from(nutritionUpdates.entries()).map(([productId, nutrition]) => {
        const existingMetadata = productMetadataMap.get(productId) || {}
        return productModuleService.updateProducts(productId, {
          metadata: {
            ...existingMetadata,
            nutrition_per_100g: nutrition,
          },
        })
      })
    )
  }

  const created = await bundleModuleService.createBundles({
    title: normalized.title,
    description: normalized.description,
    bundle_type: normalized.bundle_type,
    discount_percentage: normalized.discount_percentage,
    is_active: normalized.is_active,
    ...totals,
  })

  await bundleModuleService.createBundleItems(
    normalized.items.map((item) => ({
      product_id: item.product_id,
      product_title: item.product_title,
      variant_id: item.variant_id,
      variant_title: item.variant_title,
      thumbnail: item.thumbnail,
      quantity: item.quantity,
      weight: item.weight,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      bundle_id: created.id,
    }))
  )

  const bundle = await bundleModuleService.retrieveBundle(created.id, {
    relations: ["items"],
  })

  res.status(200).json({ bundle })
}
