import { addToCartWorkflowId } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { ICartModuleService } from "@medusajs/types"
import { randomUUID } from "node:crypto"
import { BUNDLE_MODULE } from "../../../../../modules/bundle"

type AddBundleToCartBody = {
  bundle_id?: string
}

const toAmount = (value: unknown): number => {
  if (typeof value === "number") {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (value && typeof value === "object") {
    const withValue = value as { value?: unknown; raw?: unknown }
    return toAmount(withValue.value ?? withValue.raw)
  }

  return 0
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)
  const cartModuleService: ICartModuleService = req.scope.resolve(Modules.CART)
  const workflowEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)
  const { id: cartId } = req.params
  const bundleId = ((req.body || {}) as AddBundleToCartBody).bundle_id

  if (!bundleId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "bundle_id is required")
  }

  const bundle = await bundleModuleService.retrieveBundle(bundleId, {
    relations: ["items"],
  })

  if (!bundle || !bundle.is_active) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Bundle ${bundleId} wasn't found`
    )
  }

  if (!bundle.items?.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Bundle has no products to add to cart"
    )
  }

  const operationId = randomUUID()

  await workflowEngine.run(addToCartWorkflowId, {
    input: {
      cart_id: cartId,
      items: bundle.items.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        metadata: {
          bundle_id: bundle.id,
          bundle_title: bundle.title,
          bundle_discount_percentage: bundle.discount_percentage,
          bundle_operation_id: operationId,
        },
      })),
    },
  })

  const cart = await cartModuleService.retrieveCart(cartId, {
    relations: ["items", "items.adjustments"],
  })

  const newBundleItems = (cart.items || []).filter((item) => {
    const metadata = (item.metadata || {}) as Record<string, unknown>
    return metadata.bundle_operation_id === operationId
  })

  const lineItemTotals = newBundleItems.map((item) => ({
    id: item.id,
    total: Math.max(0, toAmount(item.unit_price) * toAmount(item.quantity)),
  }))

  const baseTotal = lineItemTotals.reduce((total, lineItem) => total + lineItem.total, 0)
  const discountValue = Math.round((baseTotal * bundle.discount_percentage) / 100)
  let remainingDiscount = discountValue

  if (discountValue > 0 && baseTotal > 0) {
    const adjustments = lineItemTotals.map((lineItem, index) => {
      const isLastItem = index === lineItemTotals.length - 1
      const proportionalDiscount = isLastItem
        ? remainingDiscount
        : Math.round((lineItem.total / baseTotal) * discountValue)
      const appliedDiscount = Math.min(remainingDiscount, proportionalDiscount)
      remainingDiscount -= appliedDiscount

      return {
        item_id: lineItem.id,
        code: `BUNDLE_${bundle.id}`,
        amount: -Math.max(0, appliedDiscount),
        description: `${bundle.title} bundle discount (${bundle.discount_percentage}%)`,
      }
    })

    await cartModuleService.addLineItemAdjustments(adjustments)
  }

  const updatedCart = await cartModuleService.retrieveCart(cartId, {
    relations: ["items", "items.adjustments"],
  })

  res.status(200).json({
    cart: updatedCart,
    bundle: {
      id: bundle.id,
      title: bundle.title,
      discount_percentage: bundle.discount_percentage,
    },
  })
}
