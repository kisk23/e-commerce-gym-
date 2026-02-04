import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  BundleItem,
  ShoppingGoal,
  createBundle,
  listBundles,
  vegetableCatalog,
} from "../../../lib/vegetable-bundles"

type CreateBundlePayload = {
  name: string
  description?: string
  goal: ShoppingGoal
  discountPercent: number
  items: BundleItem[]
}

const isValidGoal = (value: unknown): value is ShoppingGoal => {
  return value === "bulk" || value === "cut"
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.status(200).json({
    bundles: listBundles(),
    vegetables: vegetableCatalog,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as CreateBundlePayload

  if (!body?.name?.trim()) {
    return res.status(400).json({ message: "Bundle name is required." })
  }

  if (!isValidGoal(body.goal)) {
    return res.status(400).json({ message: "Goal must be either bulk or cut." })
  }

  const items = Array.isArray(body.items)
    ? body.items.filter((item) => item.weightG > 0 && !!item.vegetableId)
    : []

  if (!items.length) {
    return res
      .status(400)
      .json({ message: "Add at least one vegetable with weight > 0." })
  }

  const bundle = createBundle({
    name: body.name,
    description: body.description || "Admin-created vegetable bundle.",
    goal: body.goal,
    discountPercent: body.discountPercent,
    items,
  })

  res.status(200).json({ bundle })
}
