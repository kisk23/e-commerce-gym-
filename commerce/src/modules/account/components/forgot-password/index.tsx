"use client"

import { useActionState } from "react"
import { requestPasswordReset } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ForgotPasswordProps = {
  redirectTo?: string
}

const ForgotPassword = ({ redirectTo }: ForgotPasswordProps) => {
  const [message, formAction] = useActionState(requestPasswordReset, null)
  const isSuccess = message?.type === "success"

  return (
    <div className="max-w-sm w-full flex flex-col items-center">
      <h1 className="text-large-semi uppercase mb-6">Reset password</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Enter your email and we will send instructions to reset your password.
      </p>

      <form className="w-full" action={formAction}>
        <input type="hidden" name="redirect" value={redirectTo ?? "/"} />
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />

        {isSuccess ? (
          <p className="pt-3 text-green-700 text-small-regular">
            {message.message}
          </p>
        ) : (
          <ErrorMessage error={message?.message || null} />
        )}

        <SubmitButton className="w-full mt-6">Send reset link</SubmitButton>
      </form>

      <LocalizedClientLink
        href={`/account?redirect=${encodeURIComponent(redirectTo ?? "/")}`}
        className="text-small-regular underline mt-6"
      >
        Back to sign in
      </LocalizedClientLink>
    </div>
  )
}

export default ForgotPassword
