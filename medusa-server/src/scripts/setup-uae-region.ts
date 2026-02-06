// import { ExecArgs } from "@medusajs/framework/types"
// import { ContainerRegistrationKeys, LINKS, Modules } from "@medusajs/framework/utils"
// import {
//   createWorkflow,
//   transform,
//   WorkflowResponse,
// } from "@medusajs/framework/workflows-sdk"
// import {
//   createRegionsWorkflow,
//   setRegionsPaymentProvidersStep,
//   updateStoresStep,
// } from "@medusajs/medusa/core-flows"

// const updateStoreCurrencies = createWorkflow(
//   "update-store-currencies",
//   (input: {
//     supported_currencies: { currency_code: string; is_default?: boolean }[]
//     store_id: string
//   }) => {
//     const normalizedInput = transform({ input }, (data) => {
//       return {
//         selector: { id: data.input.store_id },
//         update: {
//           supported_currencies: data.input.supported_currencies.map(
//             (currency) => {
//               return {
//                 currency_code: currency.currency_code,
//                 is_default: currency.is_default ?? false,
//               }
//             }
//           ),
//         },
//       }
//     })

//     const stores = updateStoresStep(normalizedInput)

//     return new WorkflowResponse(stores)
//   }
// )

// const normalizeCurrencyCode = (value?: string | null) =>
//   typeof value === "string" && value.trim()
//     ? value.trim().toLowerCase()
//     : ""

// const isUaeRegion = (region: { name?: string; currency_code?: string; countries?: { iso_2: string }[] }) => {
//   const name = (region.name || "").toLowerCase()
//   const currency = normalizeCurrencyCode(region.currency_code)
//   const hasCountry =
//     (region.countries || []).some((country) => normalizeCurrencyCode(country.iso_2) === "ae")

//   return hasCountry || currency === "aed" || name.includes("emirates") || name.includes("uae")
// }

// export default async function setupUaeRegion({ container }: ExecArgs) {
//   const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
//   const regionModuleService = container.resolve(Modules.REGION)
//   const storeModuleService = container.resolve(Modules.STORE)

//   const [store] = await storeModuleService.listStores({}, { relations: ["supported_currencies"] })

//   if (!store) {
//     logger.error("No store found. Aborting UAE region setup.")
//     return
//   }

//   const existingCurrencies = (store.supported_currencies || []).map((entry) =>
//     normalizeCurrencyCode(entry.currency_code)
//   )
//   const mergedCurrencies = Array.from(new Set(["aed", ...existingCurrencies])).filter(Boolean)

//   await updateStoreCurrencies(container).run({
//     input: {
//       store_id: store.id,
//       supported_currencies: mergedCurrencies.map((code) => ({
//         currency_code: code,
//         is_default: code === "aed",
//       })),
//     },
//   })

//   const regions = await regionModuleService.listRegions({}, { relations: ["countries"] })
//   let uaeRegion = regions.find(isUaeRegion)

//   const desiredPaymentProviders = ["pp_stripe_stripe", "pp_system_default"]

//   const setRegionPaymentProviders = async (regionId: string) => {
//     try {
//       await setRegionsPaymentProvidersStep(
//         { input: [{ id: regionId, payment_providers: desiredPaymentProviders }] },
//         { container }
//       )
//       return
//     } catch (error) {
//       logger.warn(
//         `Failed to set region payment providers via workflow step: ${
//           error instanceof Error ? error.message : "unknown error"
//         }`
//       )
//     }

//     try {
//       const remoteLink = container.resolve(ContainerRegistrationKeys.LINK)
//       const remoteQuery = container.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
//       const existingLinks = await remoteQuery({
//         service: LINKS.RegionPaymentProvider,
//         variables: {
//           filters: { region_id: [regionId] },
//         },
//         fields: ["region_id", "payment_provider_id"],
//       })

//       const existingProviderIds = new Set(
//         (existingLinks || []).map((link: { payment_provider_id: string }) =>
//           link.payment_provider_id
//         )
//       )

//       const linksToCreate = desiredPaymentProviders
//         .filter((providerId) => !existingProviderIds.has(providerId))
//         .map((providerId) => ({
//           [Modules.REGION]: { region_id: regionId },
//           [Modules.PAYMENT]: { payment_provider_id: providerId },
//         }))

//       if (!linksToCreate.length) {
//         logger.info("Region payment providers already linked.")
//         return
//       }

//       await remoteLink.create(linksToCreate)
//       logger.info("Region payment providers linked manually.")
//     } catch (error) {
//       logger.warn(
//         `Failed to link region payment providers manually: ${
//           error instanceof Error ? error.message : "unknown error"
//         }`
//       )
//     }
//   }

//   if (!uaeRegion) {
//     const { result } = await createRegionsWorkflow(container).run({
//       input: {
//         regions: [
//           {
//             name: "United Arab Emirates",
//             currency_code: "aed",
//             countries: ["ae"],
//             payment_providers: desiredPaymentProviders,
//           },
//         ],
//       },
//     })

//     uaeRegion = result[0]

//     if (uaeRegion) {
//       await setRegionPaymentProviders(uaeRegion.id)
//     }

//     logger.info(`Created UAE region (${uaeRegion?.id}).`)
//   } else {
//     const updatedCountries = Array.from(
//       new Set([
//         ...(uaeRegion.countries || []).map((country) =>
//           normalizeCurrencyCode(country.iso_2)
//         ),
//         "ae",
//       ])
//     )

//     await regionModuleService.updateRegions(uaeRegion.id, {
//       name: uaeRegion.name || "United Arab Emirates",
//       currency_code: "aed",
//       countries: updatedCountries,
//     })

//     await setRegionPaymentProviders(uaeRegion.id)

//     logger.info(`Updated UAE region (${uaeRegion.id}).`)
//   }

//   if (uaeRegion?.id) {
//     await storeModuleService.updateStores(store.id, {
//       default_region_id: uaeRegion.id,
//     })
//     logger.info(`Store default region set to ${uaeRegion.id}.`)
//   }
// }
