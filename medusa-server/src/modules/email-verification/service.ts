import crypto from "crypto"
import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import { EmailVerification } from "./models/email-verification"

export const EMAIL_VERIFICATION_STATUS = {
  VERIFIED: "verified",
  NOT_YET: "not_yet",
} as const

export type EmailVerificationStatus =
  (typeof EMAIL_VERIFICATION_STATUS)[keyof typeof EMAIL_VERIFICATION_STATUS]

const DEFAULT_TOKEN_TTL_HOURS = 24
const RESEND_COOLDOWN_SECONDS = 60

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const getTokenTtlMs = () => {
  const configured = Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS)
  const hours = Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_TOKEN_TTL_HOURS

  return hours * 60 * 60 * 1000
}

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex")

class EmailVerificationModuleService extends MedusaService({
  EmailVerification,
}) {
  generateToken() {
    return crypto.randomBytes(32).toString("base64url")
  }

  async getLatestVerification(customerId: string) {
    const verifications = await this.listEmailVerifications({
      customer_id: customerId,
    })

    return verifications.sort((a, b) =>
      String(b.updated_at || b.created_at || "").localeCompare(
        String(a.updated_at || a.created_at || "")
      )
    )[0] || null
  }

  async getStatusForCustomer(customerId: string): Promise<EmailVerificationStatus> {
    const verification = await this.getLatestVerification(customerId)

    return !verification || verification.status === EMAIL_VERIFICATION_STATUS.VERIFIED
      ? EMAIL_VERIFICATION_STATUS.VERIFIED
      : EMAIL_VERIFICATION_STATUS.NOT_YET
  }

  async issueVerification({
    customerId,
    email,
  }: {
    customerId: string
    email: string
  }) {
    const normalizedEmail = normalizeEmail(email)
    const existing = await this.getLatestVerification(customerId)

    if (existing?.status === EMAIL_VERIFICATION_STATUS.VERIFIED) {
      return {
        verification: existing,
        token: null,
      }
    }

    const token = this.generateToken()
    const nowIso = new Date().toISOString()
    const tokenExpiresAt = new Date(Date.now() + getTokenTtlMs()).toISOString()
    const data = {
      customer_id: customerId,
      email: normalizedEmail,
      status: EMAIL_VERIFICATION_STATUS.NOT_YET,
      token_hash: hashToken(token),
      token_expires_at: tokenExpiresAt,
      last_sent_at: nowIso,
      verified_at: null,
    }

    const verification = existing
      ? await this.updateEmailVerifications({
          id: existing.id,
          ...data,
        })
      : await this.createEmailVerifications(data)

    return {
      verification,
      token,
    }
  }

  async resendVerification({
    customerId,
    email,
  }: {
    customerId: string
    email: string
  }) {
    const existing = await this.getLatestVerification(customerId)

    if (existing?.status === EMAIL_VERIFICATION_STATUS.VERIFIED) {
      return {
        verification: existing,
        token: null,
      }
    }

    if (existing?.last_sent_at) {
      const lastSent = new Date(existing.last_sent_at).getTime()
      const elapsedSeconds = (Date.now() - lastSent) / 1000

      if (Number.isFinite(elapsedSeconds) && elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Please wait before requesting another verification email."
        )
      }
    }

    return this.issueVerification({ customerId, email })
  }

  async verifyToken(token: string) {
    const normalizedToken = token.trim()

    if (!normalizedToken) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Verification token is required."
      )
    }

    const [verification] = await this.listEmailVerifications({
      token_hash: hashToken(normalizedToken),
    })

    if (!verification) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Verification link is invalid or has already been used."
      )
    }

    if (verification.status === EMAIL_VERIFICATION_STATUS.VERIFIED) {
      return verification
    }

    const expiresAt = verification.token_expires_at
      ? new Date(verification.token_expires_at).getTime()
      : 0

    if (!expiresAt || expiresAt < Date.now()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Verification link has expired."
      )
    }

    return this.updateEmailVerifications({
      id: verification.id,
      status: EMAIL_VERIFICATION_STATUS.VERIFIED,
      verified_at: new Date().toISOString(),
      token_hash: null,
      token_expires_at: null,
    })
  }
}

export default EmailVerificationModuleService
