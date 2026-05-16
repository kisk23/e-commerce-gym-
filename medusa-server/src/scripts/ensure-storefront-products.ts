import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { upsertVariantPricesWorkflow } from "@medusajs/medusa/core-flows";

const DEFAULT_CURRENCY_CODE = "aed";
const DEFAULT_PRICE = 20;
const BATCH_SIZE = 50;

type ProductVariantRecord = {
  id: string;
  product_id: string | null;
  title: string | null;
};

const toPositiveNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function ensureStorefrontProducts({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  const currencyCode = (
    process.env.STOREFRONT_PRODUCT_CURRENCY || DEFAULT_CURRENCY_CODE
  ).toLowerCase();
  const amount = toPositiveNumber(
    process.env.STOREFRONT_PRODUCT_PRICE,
    DEFAULT_PRICE,
  );

  const missingPriceVariants = (await db("product_variant as pv")
    .leftJoin("product_variant_price_set as pvps", "pvps.variant_id", "pv.id")
    .whereNull("pv.deleted_at")
    .whereNotNull("pv.product_id")
    .whereNotExists(function () {
      this.select(db.raw("1"))
        .from("price as p")
        .whereRaw("p.price_set_id = pvps.price_set_id")
        .where("p.currency_code", currencyCode)
        .whereNull("p.deleted_at");
    })
    .select("pv.id", "pv.product_id", "pv.title")
    .orderBy("pv.created_at", "asc")) as ProductVariantRecord[];

  let updatedVariants = 0;

  logger.info(
    `Ensuring storefront product prices. currency=${currencyCode}, amount=${amount}`,
  );

  for (
    let index = 0;
    index < missingPriceVariants.length;
    index += BATCH_SIZE
  ) {
    const variantPrices = missingPriceVariants
      .slice(index, index + BATCH_SIZE)
      .filter((variant) => variant.id && variant.product_id)
      .map((variant) => ({
        variant_id: variant.id,
        product_id: variant.product_id!,
        prices: [
          {
            currency_code: currencyCode,
            amount,
          },
        ],
      }));

    if (variantPrices.length) {
      await upsertVariantPricesWorkflow(container).run({
        input: {
          variantPrices,
          previousVariantIds: [],
        },
      });

      updatedVariants += variantPrices.length;
    }
  }

  logger.info(
    `Storefront product prices ready. Added ${currencyCode} prices to ${updatedVariants} variants.`,
  );
}
