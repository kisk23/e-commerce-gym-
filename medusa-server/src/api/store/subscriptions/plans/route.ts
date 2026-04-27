import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription"
import SubscriptionModuleService from "../../../../modules/subscription/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const subscriptionService: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)

  await subscriptionService.ensureDefaultPlans()
  const plans = await subscriptionService.listSubscriptionPlans({
    is_active: true,
  })

  const sortedPlans = [...plans].sort((a, b) => {
    const rankDiff = Number(a.rank || 0) - Number(b.rank || 0)
    if (rankDiff !== 0) {
      return rankDiff
    }

    return Number(a.duration_months || 0) - Number(b.duration_months || 0)
  })

  res.status(200).json({ plans: sortedPlans })
}

