import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUBSCRIPTION_MODULE } from "../modules/subscription"
import SubscriptionModuleService from "../modules/subscription/service"

export default async function expireSubscriptionsJob({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const subscriptionService: SubscriptionModuleService = container.resolve(SUBSCRIPTION_MODULE)

  const expiredIds = await subscriptionService.expireDueSubscriptions()

  if (!expiredIds.length) {
    logger.info("No active subscriptions reached expiration.")
    return
  }

  logger.info(`Expired ${expiredIds.length} subscription(s).`)
}

export const config = {
  name: "expire-subscriptions",
  schedule: "0 0 * * *",
}

