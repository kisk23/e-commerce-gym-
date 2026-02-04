import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  createSalesChannelsWorkflow,
  createShippingProfilesWorkflow,
} from "@medusajs/medusa/core-flows"

type VegetableSeed = {
  id: string
  title: string
  description: string
  caloriesPer100g: number
  defaultWeightG: number
  pricePer100gUsd: number
  pricePer100gEur: number
}

const vegetables: VegetableSeed[] = [
  {
    id: "sweet-potato",
    title: "Sweet Potato",
    description: "Naturally sweet carb source for high-energy meals.",
    caloriesPer100g: 86,
    defaultWeightG: 250,
    pricePer100gUsd: 1.6,
    pricePer100gEur: 1.5,
  },
  {
    id: "potato",
    title: "Potato",
    description: "Reliable, versatile carb base for meal prep.",
    caloriesPer100g: 77,
    defaultWeightG: 300,
    pricePer100gUsd: 1.1,
    pricePer100gEur: 1.0,
  },
  {
    id: "corn",
    title: "Corn",
    description: "Dense carbs for fueling training sessions.",
    caloriesPer100g: 96,
    defaultWeightG: 220,
    pricePer100gUsd: 1.9,
    pricePer100gEur: 1.8,
  },
  {
    id: "broccoli",
    title: "Broccoli",
    description: "Low-calorie, fiber-rich vegetable for cutting phases.",
    caloriesPer100g: 34,
    defaultWeightG: 200,
    pricePer100gUsd: 2.4,
    pricePer100gEur: 2.3,
  },
  {
    id: "spinach",
    title: "Spinach",
    description: "Micronutrient-rich leafy green for recovery meals.",
    caloriesPer100g: 23,
    defaultWeightG: 180,
    pricePer100gUsd: 2.1,
    pricePer100gEur: 2.0,
  },
  {
    id: "zucchini",
    title: "Zucchini",
    description: "Volume food with very low calorie density.",
    caloriesPer100g: 17,
    defaultWeightG: 240,
    pricePer100gUsd: 1.7,
    pricePer100gEur: 1.6,
  },
  {
    id: "carrot",
    title: "Carrot",
    description: "Crunchy staple with balanced carbs and fiber.",
    caloriesPer100g: 41,
    defaultWeightG: 220,
    pricePer100gUsd: 1.3,
    pricePer100gEur: 1.2,
  },
  {
    id: "beetroot",
    title: "Beetroot",
    description: "Naturally sweet root vegetable for pre-workout meals.",
    caloriesPer100g: 43,
    defaultWeightG: 220,
    pricePer100gUsd: 1.5,
    pricePer100gEur: 1.4,
  },
]

const toMinorUnits = (amount: number) => Math.round(amount * 100)

export default async function seedVegetables({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)

  logger.info("Seeding vegetable products...")

  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })

  if (!defaultSalesChannel.length) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [{ name: "Default Sales Channel" }],
      },
    })

    defaultSalesChannel = result
  }

  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  })

  let shippingProfile = shippingProfiles[0]

  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [
          {
            name: "Default Shipping Profile",
            type: "default",
          },
        ],
      },
    })

    shippingProfile = result[0]
  }

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: {
      handle: vegetables.map((vegetable) => vegetable.id),
    },
  })

  const existingHandles = new Set(
    existingProducts.map((product: { handle: string }) => product.handle)
  )

  const productsToCreate = vegetables
    .filter((vegetable) => !existingHandles.has(vegetable.id))
    .map((vegetable) => ({
      title: vegetable.title,
      description: vegetable.description,
      handle: vegetable.id,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      images: [],
      metadata: {
        is_vegetable: true,
        calories_per_100g: vegetable.caloriesPer100g,
        default_weight_g: vegetable.defaultWeightG,
      },
      options: [
        {
          title: "Unit",
          values: ["100g"],
        },
      ],
      variants: [
        {
          title: "100g",
          sku: `VEG-${vegetable.id.toUpperCase()}`,
          manage_inventory: false,
          options: {
            Unit: "100g",
          },
          prices: [
            {
              currency_code: "usd",
              amount: toMinorUnits(vegetable.pricePer100gUsd),
            },
            {
              currency_code: "eur",
              amount: toMinorUnits(vegetable.pricePer100gEur),
            },
          ],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    }))

  if (!productsToCreate.length) {
    logger.info("Vegetable products already exist, no products created.")
    return
  }

  await createProductsWorkflow(container).run({
    input: {
      products: productsToCreate,
    },
  })

  logger.info(`Created ${productsToCreate.length} vegetable products.`)
}
