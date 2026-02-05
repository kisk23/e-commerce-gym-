import { addToCartWorkflowId } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { ICartModuleService } from "@medusajs/types"
import { randomUUID } from "node:crypto"
import { BUNDLE_MODULE } from "../../../../../modules/bundle"

type AddBundleToCartBody = {
  bundle_id?: string
  title?: string
  items?: {
    variant_id?: string
    quantity?: number
  }[]
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
  try {
    const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)
    const cartModuleService: ICartModuleService = req.scope.resolve(Modules.CART)
    const workflowEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)
    const { id: cartId } = req.params
    const body = (req.body || {}) as AddBundleToCartBody
    const bundleId = body.bundle_id
    const operationId = randomUUID()
    let bundleTitle = "Bundle"
    let discountPercentage = 0
    let itemsToAdd: {
      variant_id: string
      quantity: number
      metadata: Record<string, unknown>
    }[] = []

    if (bundleId) {
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

      bundleTitle = bundle.title
      discountPercentage = bundle.discount_percentage
      itemsToAdd = bundle.items.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        metadata: {
          bundle_id: bundle.id,
          bundle_title: bundle.title,
          bundle_discount_percentage: bundle.discount_percentage,
          bundle_operation_id: operationId,
          bundle_type: "admin",
        },
      }))
    } else {
      const customItems = Array.isArray(body.items) ? body.items : []
      const title = (body.title || "").trim() || "Custom Bundle"
      const customBundleId = `custom_${operationId}`

      itemsToAdd = customItems
        .filter((item) => typeof item.variant_id === "string" && !!item.variant_id)
        .map((item) => ({
          variant_id: item.variant_id as string,
          quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
          metadata: {
            bundle_id: customBundleId,
            bundle_title: title,
            bundle_discount_percentage: 0,
            bundle_operation_id: operationId,
            bundle_type: "custom",
          },
        }))

      if (!itemsToAdd.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "items are required when bundle_id is not provided"
        )
      }

      bundleTitle = title
      discountPercentage = 0
    }

    await workflowEngine.run(addToCartWorkflowId, {
      input: {
        cart_id: cartId,
        items: itemsToAdd,
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
    const discountValue = Math.round((baseTotal * discountPercentage) / 100)
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
          code: `BUNDLE_${bundleId}`,
          amount: Math.max(0, appliedDiscount),
          description: `${bundleTitle} bundle discount (${discountPercentage}%)`,
        }
      })

      const nonZeroAdjustments = adjustments.filter((adjustment) => adjustment.amount > 0)

      if (nonZeroAdjustments.length) {
        await cartModuleService.addLineItemAdjustments(nonZeroAdjustments)
      }
    }

    const updatedCart = await cartModuleService.retrieveCart(cartId, {
      relations: ["items", "items.adjustments"],
    })

    res.status(200).json({
      cart: updatedCart,
      bundle: {
        id: bundleId || `custom_${operationId}`,
        title: bundleTitle,
        discount_percentage: discountPercentage,
      },
    })
  } catch (error) {
    console.error("[line-item-bundles] Failed to add bundle to cart", error)

    const errorType =
      (error as { type?: string } | undefined)?.type ??
      (error instanceof MedusaError ? error.type : undefined)

    const statusCode =
      errorType === MedusaError.Types.INVALID_DATA
        ? 400
        : errorType === MedusaError.Types.NOT_FOUND
        ? 404
        : 500

    const message =
      error instanceof Error ? error.message : "Failed to add bundle to cart"

    res.status(statusCode).json({
      type: "bundle_add_failed",
      message,
    })
  }
}
