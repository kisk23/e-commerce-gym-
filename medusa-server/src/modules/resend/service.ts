import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils";
import type { Logger, NotificationTypes } from "@medusajs/types";
import { Resend, type CreateEmailOptions } from "resend";
import type { ReactNode } from "react";
import { OrderPlacedEmail } from "./templates/order-placed";
import { NewOrderEmail } from "./templates/new-order";
import { SubscriptionActivatedEmail } from "./templates/subscription-activated";
import { VerifyEmail } from "./templates/verify-email";
import { ResetPasswordEmail } from "./templates/reset-password";

type ResendOptions = {
  api_key: string;
  from: string;
  reply_to?: string | string[];
  html_templates?: Record<string, { subject?: string; content: string }>;
};

type InjectedDependencies = {
  logger: Logger;
};

enum Templates {
  ORDER_PLACED = "order-placed",
  NEW_ORDER = "new-order",
  SUBSCRIPTION_ACTIVATED = "subscription-activated",
  VERIFY_EMAIL = "verify-email",
  RESET_PASSWORD = "reset-password",
}

type TemplateContent = string | ((props: any) => ReactNode);

const templates: Record<Templates, TemplateContent> = {
  [Templates.ORDER_PLACED]: OrderPlacedEmail,
  [Templates.NEW_ORDER]: NewOrderEmail,
  [Templates.SUBSCRIPTION_ACTIVATED]: SubscriptionActivatedEmail,
  [Templates.VERIFY_EMAIL]: VerifyEmail,
  [Templates.RESET_PASSWORD]: ResetPasswordEmail,
};

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend";

  private resendClient: Resend;
  private options: ResendOptions;
  private logger: Logger;

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super();
    this.resendClient = new Resend(options.api_key);
    this.options = options;
    this.logger = logger;
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required in the provider's options.",
      );
    }

    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the provider's options.",
      );
    }
  }

  getTemplate(template: Templates) {
    if (this.options.html_templates?.[template]) {
      return this.options.html_templates[template].content;
    }

    const allowedTemplates = Object.keys(templates);
    if (!allowedTemplates.includes(template)) {
      return null;
    }

    return templates[template];
  }

  getTemplateSubject(template: Templates) {
    if (this.options.html_templates?.[template]?.subject) {
      return this.options.html_templates[template].subject;
    }

    switch (template) {
      case Templates.ORDER_PLACED:
        return "Your Elvar order is confirmed";
      case Templates.NEW_ORDER:
        return "New Elvar order received";
      case Templates.SUBSCRIPTION_ACTIVATED:
        return "Your Elvar subscription is active";
      case Templates.VERIFY_EMAIL:
        return "Verify your Elvar email";
      case Templates.RESET_PASSWORD:
        return "Reset your Elvar password";
      default:
        return "New Email";
    }
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO,
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    const template = this.getTemplate(notification.template as Templates);

    if (!template) {
      this.logger.error(
        `Couldn't find an email template for ${notification.template}. The valid options are ${Object.values(
          Templates,
        )}`,
      );
      return {};
    }

    const commonOptions = {
      from: this.options.from,
      to: [notification.to],
      subject: this.getTemplateSubject(notification.template as Templates),
      ...(this.options.reply_to ? { replyTo: this.options.reply_to } : {}),
    };

    let emailOptions: CreateEmailOptions;

    if (typeof template === "string") {
      emailOptions = {
        ...commonOptions,
        html: template,
      };
    } else {
      emailOptions = {
        ...commonOptions,
        react: template(notification.data),
      };
    }

    const { data, error } = await this.resendClient.emails.send(emailOptions);

    if (error || !data) {
      if (error) {
        this.logger.error("Failed to send email", error);
      } else {
        this.logger.error("Failed to send email: unknown error");
      }
      return {};
    }

    return { id: data.id };
  }
}

export default ResendNotificationProviderService;
