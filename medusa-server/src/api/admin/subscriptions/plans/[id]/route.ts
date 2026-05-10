import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription"
import SubscriptionModuleService from "../../../../../modules/subscription/service"
import {
  toInteger,
  toStringValue,
  validateDiscount,
  validateDuration,
  validatePriceAmount,
} from "../../../../subscriptions/utils"

type UpdateSubscriptionPlanBody = {
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
  const plan = await subscriptionService.retrieveSubscriptionPlan(req.params.id)

  if (!plan) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Subscription plan ${req.params.id} wasn't found`
    )
  }

  res.status(200).json({ plan })
}

export async function PUT(
  req: AuthenticatedMedusaRequest<UpdateSubscriptionPlanBody>,
  res: MedusaResponse
) {
  const subscriptionService: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)
  const payload = req.body || {}
  const current = await subscriptionService.retrieveSubscriptionPlan(req.params.id)

  if (!current) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Subscription plan ${req.params.id} wasn't found`
    )
  }

  const nextTitle = payload.title !== undefined ? toStringValue(payload.title) : current.title

  if (!nextTitle) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "title can't be empty")
  }

  const nextDuration =
    payload.duration_months !== undefined
      ? validateDuration(payload.duration_months)
      : Number(current.duration_months)
  const nextDiscount =
    payload.discount_percentage !== undefined
      ? validateDiscount(payload.discount_percentage)
      : Number(current.discount_percentage)
  const nextPriceAmount =
    payload.price_amount !== undefined
      ? validatePriceAmount(payload.price_amount)
      : Number(current.price_amount || 0)
  const nextDescription =
    payload.description !== undefined
      ? toStringValue(payload.description, "")
      : current.description || ""
  const nextRank =
    payload.rank !== undefined ? toInteger(payload.rank, nextDuration) : Number(current.rank || 0)

  const plan = await subscriptionService.updateSubscriptionPlans({
    id: req.params.id,
    title: nextTitle,
    description: nextDescription || null,
    price_amount: nextPriceAmount,
    duration_months: nextDuration,
    discount_percentage: nextDiscount,
    rank: nextRank,
    is_active: payload.is_active ?? current.is_active,
  })

  res.status(200).json({ plan })
}

export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const subscriptionService: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)
  const current = await subscriptionService.retrieveSubscriptionPlan(req.params.id)

  if (!current) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Subscription plan ${req.params.id} wasn't found`
    )
  }

  const plan = await subscriptionService.updateSubscriptionPlans({
    id: req.params.id,
    is_active: false,
  })

  res.status(200).json({ plan })
}
