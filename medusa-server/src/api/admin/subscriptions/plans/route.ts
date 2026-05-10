import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription"
import SubscriptionModuleService from "../../../../modules/subscription/service"
import {
  toInteger,
  toStringValue,
  validateDiscount,
  validateDuration,
  validatePriceAmount,
} from "../../../subscriptions/utils"

type CreateSubscriptionPlanBody = {
  title?: string
  description?: string | null
  price_amount?: number
  duration_months?: number
  discount_percentage?: number
  rank?: number
  is_active?: boolean
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const subscriptionService: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)

  await subscriptionService.ensureDefaultPlans()
  const plans = await subscriptionService.listSubscriptionPlans({})

  const sortedPlans = [...plans].sort((a, b) => {
    const rankDiff = Number(a.rank || 0) - Number(b.rank || 0)
    if (rankDiff !== 0) {
      return rankDiff
    }

    return Number(a.duration_months || 0) - Number(b.duration_months || 0)
  })

  res.status(200).json({ plans: sortedPlans })
}

export async function POST(
  req: AuthenticatedMedusaRequest<CreateSubscriptionPlanBody>,
  res: MedusaResponse
) {
  const subscriptionService: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)
  const payload = req.body || {}
  const title = toStringValue(payload.title)

  if (!title) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "title is required")
  }

  const durationMonths = validateDuration(payload.duration_months)
  const discountPercentage = validateDiscount(payload.discount_percentage)
  const priceAmount = validatePriceAmount(payload.price_amount ?? 0)
  const description = toStringValue(payload.description, "")
  const rank = toInteger(payload.rank, durationMonths)
  const isActive = payload.is_active !== false

  const plan = await subscriptionService.createSubscriptionPlans({
    title,
    description: description || null,
    price_amount: priceAmount,
    duration_months: durationMonths,
    discount_percentage: discountPercentage,
    rank,
    is_active: isActive,
  })

  res.status(200).json({ plan })
}
