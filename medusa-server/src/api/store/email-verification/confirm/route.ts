import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_VERIFICATION_MODULE } from "../../../../modules/email-verification"
import EmailVerificationModuleService, {
  EMAIL_VERIFICATION_STATUS,
} from "../../../../modules/email-verification/service"

type ConfirmBody = {
  token?: string
}

export async function POST(
  req: MedusaRequest<ConfirmBody>,
  res: MedusaResponse
) {
  const emailVerificationService: EmailVerificationModuleService =
    req.scope.resolve(EMAIL_VERIFICATION_MODULE)
  const verification = await emailVerificationService.verifyToken(
    String(req.body?.token || "")
  )

  res.status(200).json({
    status: EMAIL_VERIFICATION_STATUS.VERIFIED,
    customer_id: verification.customer_id,
    redirect: verification.redirect_url,
  })
}
