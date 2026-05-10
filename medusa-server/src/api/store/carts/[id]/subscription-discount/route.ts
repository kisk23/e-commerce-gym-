import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import type { ICartModuleService } from "@medusajs/types"
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription"
import SubscriptionModuleService from "../../../../../modules/subscription/service"
import { applySubscriptionDiscountToCart } from "../../../../../modules/subscription/utils/cart-discount"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Customer must be authenticated")
  }

  const { id: cartId } = req.params

  if (!cartId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "cart id is required")
  }

  const cartModuleService: ICartModuleService = req.scope.resolve(Modules.CART)
  const subscriptionService: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)

  const cart = await cartModuleService.retrieveCart(cartId, {
    relations: ["items", "items.adjustments"],
  })

  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} wasn't found`)
  }

  if (cart.customer_id && cart.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "You can't update this cart")
  }

  if (!cart.customer_id) {
    await cartModuleService.updateCarts(cartId, { customer_id: customerId })
  }

  const syncResult = await applySubscriptionDiscountToCart({
    cartId,
    customerId,
    cartModuleService,
    subscriptionService,
  })

  const updatedCart = await cartModuleService.retrieveCart(cartId, {
    relations: ["items", "items.adjustments"],
  })

  res.status(200).json({
    cart: updatedCart,
    subscription: syncResult.activeSubscription
      ? {
          id: syncResult.activeSubscription.id,
          plan_title: syncResult.activeSubscription.plan_title,
          discount_percentage: syncResult.discountPercentage,
          ends_at: syncResult.activeSubscription.ends_at,
        }
      : null,
  })
}
