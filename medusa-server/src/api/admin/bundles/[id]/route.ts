import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { BUNDLE_MODULE } from "../../../../modules/bundle"
import { normalizeBundleInput } from "../utils"

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

  const bundle = await bundleModuleService.retrieveBundle(req.params.id, {
    relations: ["items"],
  })

  res.status(200).json({ bundle })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const bundleId = req.params.id
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

  const existing = await bundleModuleService.retrieveBundle(bundleId, {
    relations: ["items"],
  })

  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Bundle ${bundleId} wasn't found`
    )
  }

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

  if (existing.items?.length) {
    await bundleModuleService.deleteBundleItems(existing.items.map((item) => item.id))
  }

  await bundleModuleService.updateBundles({
    id: bundleId,
    title: normalized.title,
    description: normalized.description,
    discount_percentage: normalized.discount_percentage,
    is_active: normalized.is_active,
  })

  await bundleModuleService.createBundleItems(
    normalized.items.map((item) => ({
      ...item,
      bundle_id: bundleId,
    }))
  )

  const bundle = await bundleModuleService.retrieveBundle(bundleId, {
    relations: ["items"],
  })

  res.status(200).json({ bundle })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)
  const bundleId = req.params.id

  const bundle = await bundleModuleService.retrieveBundle(bundleId, {
    relations: ["items"],
  })

  if (!bundle) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Bundle ${bundleId} wasn't found`
    )
  }

  if (bundle.items?.length) {
    await bundleModuleService.deleteBundleItems(bundle.items.map((item) => item.id))
  }

  await bundleModuleService.deleteBundles([bundleId])

  res.status(200).json({
    id: bundleId,
    deleted: true,
    object: "bundle",
  })
}
