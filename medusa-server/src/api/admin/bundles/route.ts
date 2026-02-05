import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BUNDLE_MODULE } from "../../../modules/bundle"
import { normalizeBundleInput } from "./utils"

type ProductQueryResponse = {
  data: {
    id: string
    title: string
    thumbnail: string | null
    variants?: {
      id: string
      title: string
    }[]
  }[]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)

  const bundles = await bundleModuleService.listBundles(
    {},
    {
      relations: ["items"],
    }
  )

  res.status(200).json({ bundles })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
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
    fields: ["id", "title", "thumbnail", "variants.id", "variants.title"],
    filters: {
      id: productIds,
    },
  })

  const normalized = normalizeBundleInput(
    payload as Record<string, unknown>,
    productsResult.data || []
  )

  const created = await bundleModuleService.createBundles({
    title: normalized.title,
    description: normalized.description,
    discount_percentage: normalized.discount_percentage,
    is_active: normalized.is_active,
  })

  await bundleModuleService.createBundleItems(
    normalized.items.map((item) => ({
      ...item,
      bundle_id: created.id,
    }))
  )

  const bundle = await bundleModuleService.retrieveBundle(created.id, {
    relations: ["items"],
  })

  res.status(200).json({ bundle })
}
