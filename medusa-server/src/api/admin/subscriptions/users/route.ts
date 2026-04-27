import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUBSCRIPTION_MODULE } from "../../../../modules/subscription"
import SubscriptionModuleService from "../../../../modules/subscription/service"
import { decorateRemainingTime, toStringValue } from "../../../subscriptions/utils"

type CustomerQueryResult = {
  data: {
    id: string
    email: string | null
    first_name: string | null
    last_name: string | null
  }[]
}

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const subscriptionService: SubscriptionModuleService = req.scope.resolve(SUBSCRIPTION_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const statusParam = toStringValue(req.query.status, "").toLowerCase()

  await subscriptionService.expireDueSubscriptions()

  const filters =
    statusParam && statusParam !== "all"
      ? {
          status: statusParam,
        }
      : {}

  const subscriptions = await subscriptionService.listCustomerSubscriptions(filters, {
    relations: ["plan"],
  })

  const customerIds = Array.from(
    new Set(
      subscriptions
        .map((subscription) => subscription.customer_id)
        .filter((customerId): customerId is string => typeof customerId === "string" && !!customerId)
    )
  )

  let customerMap = new Map<
    string,
    {
      id: string
      email: string | null
      first_name: string | null
      last_name: string | null
    }
  >()

  if (customerIds.length) {
    const customersResult: CustomerQueryResult = await query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name"],
      filters: {
        id: customerIds,
      },
    })

    customerMap = new Map((customersResult.data || []).map((customer) => [customer.id, customer]))
  }

  const nowIso = new Date().toISOString()

  const subscribers = subscriptions
    .map((subscription) => {
      const customer = customerMap.get(subscription.customer_id)

      return decorateRemainingTime(
        {
          ...subscription,
          customer: customer
            ? {
                id: customer.id,
                email: customer.email,
                first_name: customer.first_name,
                last_name: customer.last_name,
              }
            : null,
        },
        nowIso
      )
    })
    .sort((a, b) => {
      const activeA = a.status === "active" ? 0 : 1
      const activeB = b.status === "active" ? 0 : 1

      if (activeA !== activeB) {
        return activeA - activeB
      }

      return (b.ends_at || "").localeCompare(a.ends_at || "")
    })

  res.status(200).json({ subscribers })
}

