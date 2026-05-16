import type {
  CreateProductWorkflowInputDTO,
  ExecArgs,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createSalesChannelsWorkflow,
  createShippingProfilesWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

const DEFAULT_PRODUCT_COUNT = 100;
const DEFAULT_CURRENCY_CODE = "aed";
const DEFAULT_IMAGE_URL = "http://localhost:9000/static/sample-product.jpg";
const DEFAULT_BATCH_SIZE = 25;

const CATEGORY_NAMES = ["vegetables", "fruits", "nuts", "protein", "grains"];

const PRODUCT_NAMES = [
  "Avocado",
  "Almonds",
  "Banana",
  "Broccoli",
  "Cashews",
  "Chicken Breast",
  "Chickpeas",
  "Dates",
  "Eggplant",
  "Greek Yogurt",
  "Lentils",
  "Mango",
  "Oats",
  "Quinoa",
  "Spinach",
  "Sweet Potato",
  "Tomato",
  "Walnuts",
  "Zucchini",
  "Brown Rice",
];

const toPositiveInteger = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getNutrition = (index: number) => ({
  calories: 80 + ((index * 37) % 420),
  protein: 4 + ((index * 11) % 55),
  carbs: 8 + ((index * 17) % 90),
  fat: 1 + ((index * 7) % 65),
});

const getPrice = (index: number) => 8 + ((index * 3) % 45);

async function getDefaultSalesChannel(container: ExecArgs["container"]) {
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  let [salesChannel] = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });

    salesChannel = result[0];
  }

  const storeModuleService = container.resolve(Modules.STORE);
  const [store] = await storeModuleService.listStores();

  if (store?.id && store.default_sales_channel_id !== salesChannel.id) {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: { default_sales_channel_id: salesChannel.id },
      },
    });
  }

  return salesChannel;
}

async function getDefaultShippingProfile(container: ExecArgs["container"]) {
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  let [shippingProfile] = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });

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
    });

    shippingProfile = result[0];
  }

  return shippingProfile;
}

async function ensureCategories(container: ExecArgs["container"]) {
  const productModuleService = container.resolve(Modules.PRODUCT);
  const handles = CATEGORY_NAMES.map(slugify);

  const existingCategories = await productModuleService.listProductCategories(
    { handle: handles },
    { withDeleted: false },          // <-- add this second arg
  );

  const existingByHandle = new Map(
    existingCategories.map((category) => [category.handle, category]),
  );

  const categoriesToCreate = CATEGORY_NAMES.filter(
    (name) => !existingByHandle.has(slugify(name)),
  ).map((name) => ({
    name,
    handle: slugify(name),
    is_active: true,
  }));

  if (categoriesToCreate.length) {
    try {
      const { result } = await createProductCategoriesWorkflow(container).run({
        input: { product_categories: categoriesToCreate },
      });

      result.forEach((category) => {
        existingByHandle.set(category.handle, category);
      });
    } catch (err) {
      // Guard against a race where another process created categories
      // between our list() and createProductCategoriesWorkflow() calls.
      if (err?.message?.includes("already exists")) {
        const refetched = await productModuleService.listProductCategories(
          { handle: handles },
          { withDeleted: false },
        );
        refetched.forEach((cat) => existingByHandle.set(cat.handle, cat));
      } else {
        throw err;
      }
    }
  }

  return handles
    .map((handle) => existingByHandle.get(handle))
    .filter((category): category is NonNullable<typeof category> =>
      Boolean(category),
    );
}

export default async function seedProducts100({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productCount = toPositiveInteger(
    process.env.PRODUCT_SEED_COUNT,
    DEFAULT_PRODUCT_COUNT,
  );
  const currencyCode = (
    process.env.PRODUCT_SEED_CURRENCY || DEFAULT_CURRENCY_CODE
  ).toLowerCase();
  const imageUrl = process.env.PRODUCT_SEED_IMAGE_URL || DEFAULT_IMAGE_URL;
  const batchId = process.env.PRODUCT_SEED_BATCH || Date.now().toString();

  logger.info(
    `Seeding ${productCount} products. currency=${currencyCode}, batch=${batchId}`,
  );

  const [salesChannel, shippingProfile, categories] = await Promise.all([
    getDefaultSalesChannel(container),
    getDefaultShippingProfile(container),
    ensureCategories(container),
  ]);

  const products: CreateProductWorkflowInputDTO[] = Array.from(
    { length: productCount },
    (_, index) => {
      const productNumber = index + 1;
      const baseName = PRODUCT_NAMES[index % PRODUCT_NAMES.length];
      const title = `${baseName} ${productNumber}`;
      const category = categories[index % categories.length];

      return {
        title,
        handle: `${slugify(title)}-${batchId}`,
        subtitle: "Seeded storefront product",
        description: `${title} seeded for storefront catalog testing.`,
        status: ProductStatus.PUBLISHED,
        is_giftcard: false,
        discountable: true,
        thumbnail: imageUrl,
        images: [{ url: imageUrl }],
        category_ids: category ? [category.id] : [],
        shipping_profile_id: shippingProfile.id,
        sales_channels: [{ id: salesChannel.id }],
        metadata: {
          seed_batch: batchId,
          nutrition_per_100g: getNutrition(productNumber),
        },
        options: [
          {
            title: "Weight",
            values: ["1kg"],
          },
        ],
        variants: [
          {
            title: "1kg",
            sku: `SEED-${batchId}-${String(productNumber).padStart(3, "0")}`,
            manage_inventory: false,
            allow_backorder: true,
            options: {
              Weight: "1kg",
            },
            prices: [
              {
                currency_code: currencyCode,
                amount: getPrice(productNumber),
              },
            ],
          },
        ],
      };
    },
  );

  let createdProducts = 0;

  for (let index = 0; index < products.length; index += DEFAULT_BATCH_SIZE) {
    const batch = products.slice(index, index + DEFAULT_BATCH_SIZE);

    await createProductsWorkflow(container).run({
      input: {
        products: batch,
      },
    });

    createdProducts += batch.length;
    logger.info(`Created ${createdProducts}/${products.length} products.`);
  }

  logger.info(`Finished seeding ${createdProducts} products.`);
}
