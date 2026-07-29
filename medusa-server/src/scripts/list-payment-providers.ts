import { ExecArgs } from "@medusajs/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function listPaymentProviders({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const paymentModuleService = container.resolve(Modules.PAYMENT);

  const providers = await paymentModuleService.listPaymentProviders({});

  if (!providers.length) {
    logger.info("No payment providers found.");
    return;
  }

  providers.forEach((provider: { id: string; is_enabled?: boolean }) => {
    logger.info(
      `Payment provider: ${provider.id} (enabled: ${provider.is_enabled ?? "unknown"})`,
    );
  });
}
