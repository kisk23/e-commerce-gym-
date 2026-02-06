import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/types"

type NutritionPer100g = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : NaN
  }

  return NaN
}

const toNonNegativeNumber = (value: unknown) => {
  const parsed = toNumber(value)
  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, parsed)
}

const normalizeNutrition = (value: unknown): NutritionPer100g => {
  if (!value || typeof value !== "object") {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  }

  const payload = value as Record<string, unknown>

  return {
    calories: toNonNegativeNumber(payload.calories),
    protein: toNonNegativeNumber(payload.protein),
    carbs: toNonNegativeNumber(payload.carbs),
    fat: toNonNegativeNumber(payload.fat),
  }
}

const retrieveProduct = async (req: MedusaRequest, id: string) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
    filters: {
      id: [id],
    },
  })

  return (data || [])[0] as
    | { id: string; title: string; metadata?: Record<string, unknown> | null }
    | undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id
  const product = await retrieveProduct(req, productId)

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product ${productId} wasn't found`)
  }

  const nutrition = normalizeNutrition(
    (product.metadata as Record<string, unknown> | null | undefined)?.nutrition_per_100g
  )

  res.status(200).json({
    product: {
      id: product.id,
      title: product.title,
      nutrition_per_100g: nutrition,
    },
  })
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id
  const product = await retrieveProduct(req, productId)

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Product ${productId} wasn't found`)
  }

  const payload = (req.body || {}) as { nutrition_per_100g?: unknown }
  const nutrition = normalizeNutrition(payload.nutrition_per_100g)

  const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
  await productModuleService.updateProducts(productId, {
    metadata: {
      ...(product.metadata || {}),
      nutrition_per_100g: nutrition,
    },
  })

  res.status(200).json({
    product: {
      id: productId,
      nutrition_per_100g: nutrition,
    },
  })
}
