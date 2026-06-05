"use client"

import { useActionState } from "react"
import { resetPassword } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ResetPasswordProps = {
  token?: string
  redirectTo?: string
}

const ResetPassword = ({ token, redirectTo }: ResetPasswordProps) => {
  const [message, formAction] = useActionState(resetPassword, null)

  return (
    <div className="max-w-sm w-full flex flex-col items-center">
      <h1 className="text-large-semi uppercase mb-6">Choose password</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Enter a new password for your account.
      </p>

      <form className="w-full" action={formAction}>
        <input type="hidden" name="token" value={token ?? ""} />
        <input type="hidden" name="redirect" value={redirectTo ?? "/"} />

        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        <ErrorMessage error={message?.message || null} />

        <SubmitButton className="w-full mt-6">Update password</SubmitButton>
      </form>

      <LocalizedClientLink
        href={`/forgot-password?redirect=${encodeURIComponent(
          redirectTo ?? "/"
        )}`}
        className="text-small-regular underline mt-6"
      >
        Request a new link
      </LocalizedClientLink>
    </div>
  )
}

export default ResetPassword
