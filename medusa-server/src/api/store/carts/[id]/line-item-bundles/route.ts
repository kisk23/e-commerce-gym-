import { addToCartWorkflowId } from "@medusajs/core-flows"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { ICartModuleService } from "@medusajs/types"
import { randomUUID } from "node:crypto"
import { BUNDLE_MODULE } from "../../../../../modules/bundle"
import { roundValue, getVariantPriceMap } from "../../../../../modules/bundle/utils/pricing"
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription"
import SubscriptionModuleService from "../../../../../modules/subscription/service"
import { applySubscriptionDiscountToCart } from "../../../../../modules/subscription/utils/cart-discount"

type AddBundleToCartBody = {
  bundle_id?: string
  title?: string
  items?: {
    variant_id?: string
    quantity?: number
  }[]
}

const WEIGHT_STEP_G = 100

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

// 1️ Gets bundle info (or custom bundle from request)
// 2️ Converts bundle → cart line items
// 3️ Adds them via Medusa workflow
// 4️ Fetches new cart items
// 5️ Calculates bundle discount
// 6️ Applies discount proportionally to those items
// 7️ Returns updated cart
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)
    const subscriptionModuleService: SubscriptionModuleService = req.scope.resolve(
      SUBSCRIPTION_MODULE
    )
    const cartModuleService: ICartModuleService = req.scope.resolve(Modules.CART)
    const workflowEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { id: cartId } = req.params
    const body = (req.body || {}) as AddBundleToCartBody
    const bundleId = body.bundle_id
    const operationId = randomUUID()
    let bundleTitle = "Bundle"
    let discountPercentage = 0
    let itemsToAdd: {
      variant_id: string
      quantity: number
      unit_price?: number
      metadata: Record<string, unknown>
    }[] = []

    const cartSnapshot = await cartModuleService.retrieveCart(cartId)
    const cartCurrency = cartSnapshot?.currency_code || "aed"

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
      const variantIds = Array.from(
        new Set(bundle.items.map((item) => item.variant_id).filter(Boolean))
      ) as string[]
      const priceMap = await getVariantPriceMap(query, variantIds, cartCurrency)

      itemsToAdd = bundle.items.map((item) => {
        const pricePer100g = priceMap.get(item.variant_id) ?? 0
        const bundleItemCount = Math.max(1, Math.round(Number(item.quantity) || 1))
        const itemWeight = Math.max(0, Number(item.weight) || 0)
        const itemWeightUnits =
          itemWeight > 0 ? Math.max(1, Math.round(itemWeight / WEIGHT_STEP_G)) : 1
        const lineQuantity = Math.max(1, itemWeightUnits * bundleItemCount)
        const selectedWeightG = lineQuantity * WEIGHT_STEP_G
        const unitPrice = pricePer100g > 0 ? roundValue(pricePer100g) : undefined

        return {
          variant_id: item.variant_id,
          quantity: lineQuantity,
          ...(typeof unitPrice === "number" && unitPrice > 0
            ? { unit_price: unitPrice }
            : {}),
          metadata: {
            bundle_id: bundle.id,
            bundle_title: bundle.title,
            bundle_discount_percentage: bundle.discount_percentage,
            bundle_operation_id: operationId,
            bundle_type: "admin",
            bundle_item_units: lineQuantity,
            bundle_item_count: bundleItemCount,
            bundle_item_weight: itemWeight,
            bundle_item_weight_g: itemWeight,
            bundle_price_per_100g: pricePer100g,
            weight_g: WEIGHT_STEP_G,
            selected_weight_g: selectedWeightG,
            selected_weight_unit_g: WEIGHT_STEP_G,
          },
        }
      })
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
            bundle_item_units: Math.max(1, Math.round(Number(item.quantity) || 1)),
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

    const syncResult = await applySubscriptionDiscountToCart({
      cartId,
      customerId: cartSnapshot?.customer_id || undefined,
      cartModuleService,
      subscriptionService: subscriptionModuleService,
    })

    const updatedCart = await cartModuleService.retrieveCart(cartId, {
      relations: ["items", "items.adjustments"],
    })
//{   "cart": { ...updated cart object... },
//    "bundle": {
//      "id": "bundle id or custom_operation_id",
//      "title": "bundle title",
//      "discount_percentage": "bundle discount percentage"
// to add some info for user
//    }
    res.status(200).json({
      cart: updatedCart,
      bundle: {
        id: bundleId || `custom_${operationId}`,
        title: bundleTitle,
        discount_percentage: discountPercentage,
      },
      subscription: syncResult.activeSubscription
        ? {
            id: syncResult.activeSubscription.id,
            plan_title: syncResult.activeSubscription.plan_title,
            discount_percentage: syncResult.discountPercentage,
            ends_at: syncResult.activeSubscription.ends_at,
          }
        : null,
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
