import { model } from "@medusajs/framework/utils"

export const EmailVerification = model.define("email_verification", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  email: model.text(),
  status: model.text(),
  token_hash: model.text().nullable(),
  token_expires_at: model.text().nullable(),
  last_sent_at: model.text().nullable(),
  verified_at: model.text().nullable(),
})
