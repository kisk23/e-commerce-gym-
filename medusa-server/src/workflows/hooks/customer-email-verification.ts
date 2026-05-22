import { createCustomersWorkflow } from "@medusajs/medusa/core-flows"
import { EMAIL_VERIFICATION_MODULE } from "../../modules/email-verification"
import EmailVerificationModuleService from "../../modules/email-verification/service"
import { sendVerificationEmail } from "../../modules/email-verification/utils"

createCustomersWorkflow.hooks.customersCreated(
  async ({ customers }, { container }) => {
    const emailVerificationService: EmailVerificationModuleService =
      container.resolve(EMAIL_VERIFICATION_MODULE)

    for (const customer of customers) {
      if (!(customer as { has_account?: boolean }).has_account) {
        continue
      }

      const { token } = await emailVerificationService.issueVerification({
        customerId: customer.id,
        email: customer.email,
      })

      if (!token) {
        continue
      }

      await sendVerificationEmail({
        container,
        customerId: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        token,
      })
    }
  }
)
