import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUBSCRIPTION_MODULE } from "../modules/subscription"
import SubscriptionModuleService from "../modules/subscription/service"

export default async function setupSubscriptionPlans({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const subscriptionService: SubscriptionModuleService = container.resolve(SUBSCRIPTION_MODULE)

  const plans = await subscriptionService.ensureDefaultPlans()

  logger.info(`Subscription plans ready. Total plans: ${plans.length}`)
}

