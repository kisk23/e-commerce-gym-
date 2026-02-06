import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { BUNDLE_MODULE } from "../../../modules/bundle"

type StoreQueryResponse = {
  data: {
    id: string
    supported_currencies?: (
      | {
          currency_code?: string | null
          is_default?: boolean | null
        }
      | null
    )[] | null
  }[]
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bundleModuleService = req.scope.resolve(BUNDLE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const bundles = await bundleModuleService.listBundles(
    {
      is_active: true,
    },
    {
      relations: ["items"],
    }
  )

  const storeResult: StoreQueryResponse = await query.graph({
    entity: "store",
    fields: ["id", "supported_currencies.currency_code", "supported_currencies.is_default"],
  })
  const supportedCurrencies =
    (storeResult.data || [])[0]?.supported_currencies || []
  const defaultCurrency =
    supportedCurrencies.find((currency) => currency?.is_default)?.currency_code ||
    supportedCurrencies.find((currency) => currency?.currency_code)?.currency_code ||
    "aed"

  res.status(200).json({
    bundles: (bundles || []).map((bundle) => ({
      ...bundle,
      currency_code: defaultCurrency,
    })),
  })
}
