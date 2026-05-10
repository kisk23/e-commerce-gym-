import { MedusaError } from "@medusajs/framework/utils"
import { addMonths, getRemainingTime, toIsoString } from "../../modules/subscription/utils/date"

export const toInteger = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback
}

export const toStringValue = (value: unknown, fallback = "") => {
  if (typeof value !== "string") {
    return fallback
  }

  const normalized = value.trim()
  return normalized || fallback
}

export const validateDiscount = (value: unknown) => {
  const discount = toInteger(value, NaN)
  if (!Number.isFinite(discount) || discount < 0 || discount >= 100) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "discount_percentage must be a number between 0 and 99"
    )
  }

  return discount
}

export const validateDuration = (value: unknown) => {
  const duration = toInteger(value, NaN)

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "duration_months must be a positive integer"
    )
  }

  return duration
}

export const validatePriceAmount = (value: unknown) => {
  const priceAmount = toInteger(value, NaN)

  if (!Number.isFinite(priceAmount) || priceAmount < 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "price_amount must be a non-negative integer"
    )
  }

  return priceAmount
}

export const computeSubscriptionWindow = (startAt: string | Date, durationMonths: number) => {
  const starts_at = toIsoString(startAt)
  const ends_at = addMonths(starts_at, durationMonths)

  return {
    starts_at,
    ends_at,
  }
}

export const decorateRemainingTime = <
  T extends {
    ends_at: string
    status?: string | null
  },
>(
  subscription: T,
  nowIso = new Date().toISOString()
) => {
  const remaining = getRemainingTime(subscription.ends_at, nowIso)

  return {
    ...subscription,
    ...remaining,
    is_active: (subscription.status || "").toLowerCase() === "active" && remaining.remaining_ms > 0,
  }
}
