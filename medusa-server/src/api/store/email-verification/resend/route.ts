import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import type { ICustomerModuleService } from "@medusajs/types"
import { EMAIL_VERIFICATION_MODULE } from "../../../../modules/email-verification"
import EmailVerificationModuleService, {
  EMAIL_VERIFICATION_STATUS,
} from "../../../../modules/email-verification/service"
import { sendVerificationEmail } from "../../../../modules/email-verification/utils"

type ResendBody = {
  redirect?: string
}

export async function POST(
  req: AuthenticatedMedusaRequest<ResendBody>,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer must be authenticated"
    )
  }

  const customerService: ICustomerModuleService = req.scope.resolve(
    Modules.CUSTOMER
  )
  const emailVerificationService: EmailVerificationModuleService =
    req.scope.resolve(EMAIL_VERIFICATION_MODULE)
  const customer = await customerService.retrieveCustomer(customerId)
  const { token, verification } =
    await emailVerificationService.resendVerification({
      customerId,
      email: customer.email,
      redirectUrl: req.body?.redirect,
    })

  if (token) {
    await sendVerificationEmail({
      container: req.scope,
      customerId,
      email: customer.email,
      firstName: customer.first_name,
      token,
      redirectUrl: verification.redirect_url,
    })
  }

  res.status(200).json({
    status:
      verification.status === EMAIL_VERIFICATION_STATUS.VERIFIED
        ? EMAIL_VERIFICATION_STATUS.VERIFIED
        : EMAIL_VERIFICATION_STATUS.NOT_YET,
  })
}
