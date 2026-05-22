import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { EMAIL_VERIFICATION_MODULE } from "../../../../modules/email-verification"
import EmailVerificationModuleService from "../../../../modules/email-verification/service"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Customer must be authenticated"
    )
  }

  const emailVerificationService: EmailVerificationModuleService =
    req.scope.resolve(EMAIL_VERIFICATION_MODULE)

  res.status(200).json({
    status: await emailVerificationService.getStatusForCustomer(customerId),
  })
}
