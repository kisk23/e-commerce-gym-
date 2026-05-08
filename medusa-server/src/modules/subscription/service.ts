import { MedusaService } from "@medusajs/framework/utils"
import { SubscriptionPlan } from "./models/subscription-plan"
import { CustomerSubscription } from "./models/customer-subscription"
import { addMonths, isPast, toValidDate } from "./utils/date"

type PricingSegment = {
  plan_id: string
  plan_title: string
  starts_at: string
  ends_at: string
  duration_months: number
  discount_percentage: number
  price_amount: number
}

const toFiniteNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeDiscountPercentage = (value: number) => {
  const rounded = Math.round(value * 100) / 100
  return Math.max(0, Math.min(99.99, rounded))
}

const toIsoOrFallback = (value: string | undefined, fallback: string) => {
  const parsed = toValidDate(value || "")
  return parsed ? parsed.toISOString() : fallback
}

const normalizeSegment = (segment: Partial<PricingSegment>) => {
  const startsAt = toIsoOrFallback(segment.starts_at, new Date().toISOString())
  const endsAtCandidate = toIsoOrFallback(segment.ends_at, addMonths(startsAt, 1))
  const startsDate = toValidDate(startsAt)
  const endsDate = toValidDate(endsAtCandidate)
  const endsAt =
    startsDate && endsDate && endsDate.getTime() > startsDate.getTime()
      ? endsDate.toISOString()
      : addMonths(startsAt, Math.max(1, Math.round(toFiniteNumber(segment.duration_months, 1))))

  return {
    plan_id: String(segment.plan_id || ""),
    plan_title: String(segment.plan_title || ""),
    starts_at: startsAt,
    ends_at: endsAt,
    duration_months: Math.max(1, Math.round(toFiniteNumber(segment.duration_months, 1))),
    discount_percentage: normalizeDiscountPercentage(toFiniteNumber(segment.discount_percentage, 0)),
    price_amount: Math.max(0, Math.round(toFiniteNumber(segment.price_amount, 0))),
  } as PricingSegment
}

const parsePricingSegments = (rawValue: unknown): PricingSegment[] => {
  if (typeof rawValue !== "string" || !rawValue.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((segment): segment is Partial<PricingSegment> => !!segment && typeof segment === "object")
      .map((segment) => normalizeSegment(segment))
      .sort((a, b) => {
        const aTime = toValidDate(a.starts_at)?.getTime() || 0
        const bTime = toValidDate(b.starts_at)?.getTime() || 0
        return aTime - bTime
      })
  } catch {
    return []
  }
}

const serializePricingSegments = (segments: PricingSegment[]) => JSON.stringify(segments)

const buildSegmentFromPurchase = ({
  startsAt,
  durationMonths,
  discountPercentage,
  planId,
  planTitle,
  priceAmount,
}: {
  startsAt: string
  durationMonths: number
  discountPercentage: number
  planId: string
  planTitle: string
  priceAmount: number
}) => {
  const normalizedStartsAt = toIsoOrFallback(startsAt, new Date().toISOString())
  const normalizedDurationMonths = Math.max(1, Math.round(toFiniteNumber(durationMonths, 1)))

  return normalizeSegment({
    plan_id: planId,
    plan_title: planTitle,
    starts_at: normalizedStartsAt,
    ends_at: addMonths(normalizedStartsAt, normalizedDurationMonths),
    duration_months: normalizedDurationMonths,
    discount_percentage: normalizeDiscountPercentage(discountPercentage),
    price_amount: Math.max(0, Math.round(toFiniteNumber(priceAmount, 0))),
  })
}

const DEFAULT_PLANS = [
  {
    title: "Monthly",
    description: "Pay monthly with no long-term commitment.",
    price_amount: 20,
    duration_months: 1,
    discount_percentage: 0,
    rank: 1,
    is_active: true,
  },
  {
    title: "Quarterly",
    description: "Prepaid subscription for 3 months.",
    price_amount: 60,
    duration_months: 3,
    discount_percentage: 5,
    rank: 2,
    is_active: true,
  },
  {
    title: "Semi-Annual",
    description: "Prepaid subscription for 6 months.",
    price_amount: 120,
    duration_months: 6,
    discount_percentage: 10,
    rank: 3,
    is_active: true,
  },
  {
    title: "Annual",
    description: "Prepaid subscription for 12 months.",
    price_amount: 240,
    duration_months: 12,
    discount_percentage: 18,
    rank: 4,
    is_active: true,
  },
]

class SubscriptionModuleService extends MedusaService({
  SubscriptionPlan,
  CustomerSubscription,
}) {
  getEffectiveDiscountFromSegments(
    segments: PricingSegment[],
    nowIso = new Date().toISOString(),
    fallbackDiscount = 0
  ) {
    const pivot = toValidDate(nowIso) || new Date()

    let weightedMs = 0
    let weightedDiscountMs = 0

    for (const segment of segments) {
      const segmentStart = toValidDate(segment.starts_at)
      const segmentEnd = toValidDate(segment.ends_at)

      if (!segmentStart || !segmentEnd) {
        continue
      }

      const activeStartMs = Math.max(segmentStart.getTime(), pivot.getTime())
      const activeEndMs = segmentEnd.getTime()
      const activeMs = Math.max(0, activeEndMs - activeStartMs)

      if (activeMs <= 0) {
        continue
      }

      weightedMs += activeMs
      weightedDiscountMs += activeMs * normalizeDiscountPercentage(segment.discount_percentage)
    }

    if (weightedMs <= 0) {
      return normalizeDiscountPercentage(fallbackDiscount)
    }

    return normalizeDiscountPercentage(weightedDiscountMs / weightedMs)
  }

  getPricingSegmentsForSubscription(
    subscription: {
      starts_at?: string | null
      ends_at?: string | null
      duration_months?: number | null
      discount_percentage?: number | null
      plan_id?: string | null
      plan_title?: string | null
      pricing_segments?: string | null
      plan?: { price_amount?: number | null } | null
    },
    nowIso = new Date().toISOString()
  ) {
    const parsed = parsePricingSegments(subscription.pricing_segments)
    if (parsed.length) {
      return parsed
    }

    const startsAt = toIsoOrFallback(subscription.starts_at || "", nowIso)
    const endsAt = toIsoOrFallback(subscription.ends_at || "", addMonths(startsAt, 1))
    const startsDate = toValidDate(startsAt)
    const endsDate = toValidDate(endsAt)
    const computedDuration =
      startsDate && endsDate && endsDate.getTime() > startsDate.getTime()
        ? Math.max(1, Math.round(toFiniteNumber(subscription.duration_months, 1)))
        : 1

    return [
      buildSegmentFromPurchase({
        startsAt,
        durationMonths: computedDuration,
        discountPercentage: toFiniteNumber(subscription.discount_percentage, 0),
        planId: String(subscription.plan_id || ""),
        planTitle: String(subscription.plan_title || ""),
        priceAmount: toFiniteNumber(subscription.plan?.price_amount, 0),
      }),
    ]
  }

  async ensureDefaultPlans() {
    const existingPlans = await this.listSubscriptionPlans({})
    const existingByDuration = new Set(existingPlans.map((plan) => Number(plan.duration_months)))
    const missingPlans = DEFAULT_PLANS.filter(
      (plan) => !existingByDuration.has(Number(plan.duration_months))
    )

    if (!missingPlans.length) {
      return existingPlans
    }

    for (const plan of missingPlans) {
      await this.createSubscriptionPlans(plan)
    }

    return this.listSubscriptionPlans({})
  }

  async expireDueSubscriptions(nowIso = new Date().toISOString()) {
    const activeSubscriptions = await this.listCustomerSubscriptions({
      status: "active",
    })

    const expiredIds = activeSubscriptions
      .filter((subscription) => isPast(subscription.ends_at, nowIso))
      .map((subscription) => subscription.id)

    if (!expiredIds.length) {
      return []
    }

    await Promise.all(
      expiredIds.map((id) =>
        this.updateCustomerSubscriptions({
          id,
          status: "expired",
        })
      )
    )

    return expiredIds
  }

  async getActiveSubscriptionForCustomer(customerId: string, nowIso = new Date().toISOString()) {
    const subscriptions = await this.listCustomerSubscriptions({
      customer_id: customerId,
      status: "active",
    })

    if (!subscriptions.length) {
      return null
    }

    const sorted = subscriptions.sort((a, b) => {
      const aDate = toValidDate(a.ends_at)?.getTime() || 0
      const bDate = toValidDate(b.ends_at)?.getTime() || 0
      return bDate - aDate
    })

    const active = sorted.find((subscription) => !isPast(subscription.ends_at, nowIso))

    if (!active) {
      await Promise.all(
        sorted.map((subscription) =>
          this.updateCustomerSubscriptions({
            id: subscription.id,
            status: "expired",
          })
        )
      )
      return null
    }

    const segments = this.getPricingSegmentsForSubscription(active, nowIso)
    const effectiveDiscount = this.getEffectiveDiscountFromSegments(
      segments,
      nowIso,
      toFiniteNumber(active.discount_percentage, 0)
    )
    const serializedSegments = serializePricingSegments(segments)

    if (
      serializedSegments !== String(active.pricing_segments || "") ||
      effectiveDiscount !== normalizeDiscountPercentage(toFiniteNumber(active.discount_percentage, 0))
    ) {
      const updated = await this.updateCustomerSubscriptions({
        id: active.id,
        pricing_segments: serializedSegments,
        discount_percentage: effectiveDiscount,
      })

      return updated
    }

    return active
  }

  async activatePlanForCustomer({
    customerId,
    plan,
    nowIso = new Date().toISOString(),
  }: {
    customerId: string
    plan: {
      id: string
      title: string
      duration_months: number
      discount_percentage: number
      price_amount?: number
    }
    nowIso?: string
  }) {
    const active = await this.getActiveSubscriptionForCustomer(customerId, nowIso)
    const durationMonths = Number(plan.duration_months || 0)
    const discountPercentage = toFiniteNumber(plan.discount_percentage, 0)
    const priceAmount = Math.max(0, Math.round(toFiniteNumber(plan.price_amount, 0)))
    const normalizedNowIso = toIsoOrFallback(nowIso, new Date().toISOString())

    if (active) {
      const extensionAnchor = toIsoOrFallback(active.ends_at || "", normalizedNowIso)
      const nextSegment = buildSegmentFromPurchase({
        startsAt: extensionAnchor,
        durationMonths,
        discountPercentage,
        planId: plan.id,
        planTitle: plan.title,
        priceAmount,
      })
      const existingSegments = this.getPricingSegmentsForSubscription(active, normalizedNowIso)
      const nextSegments = [...existingSegments, nextSegment]
      const effectiveDiscountPercentage = this.getEffectiveDiscountFromSegments(
        nextSegments,
        normalizedNowIso,
        toFiniteNumber(active.discount_percentage, 0)
      )
      const action =
        String(active.plan_id || "") === String(plan.id || "")
          ? ("extended" as const)
          : ("switched" as const)

      const updated = await this.updateCustomerSubscriptions({
        id: active.id,
        plan_id: plan.id,
        plan_title: plan.title,
        starts_at: toIsoOrFallback(active.starts_at || "", normalizedNowIso),
        duration_months: Number(active.duration_months || 0) + durationMonths,
        discount_percentage: effectiveDiscountPercentage,
        pricing_segments: serializePricingSegments(nextSegments),
        ends_at: nextSegment.ends_at,
        status: "active",
        cancelled_at: null,
      })

      return {
        subscription: updated,
        action,
      }
    }

    const created = await this.createCustomerSubscriptions({
      customer_id: customerId,
      plan_id: plan.id,
      plan_title: plan.title,
      duration_months: durationMonths,
      discount_percentage: normalizeDiscountPercentage(discountPercentage),
      pricing_segments: serializePricingSegments([
        buildSegmentFromPurchase({
          startsAt: normalizedNowIso,
          durationMonths,
          discountPercentage,
          planId: plan.id,
          planTitle: plan.title,
          priceAmount,
        }),
      ]),
      starts_at: normalizedNowIso,
      ends_at: addMonths(normalizedNowIso, durationMonths),
      status: "active",
    })

    return {
      subscription: created,
      action: "created" as const,
    }
  }
}

export default SubscriptionModuleService
