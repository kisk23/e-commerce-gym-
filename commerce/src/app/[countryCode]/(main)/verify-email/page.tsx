import { confirmEmailVerification } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token || ""
  const result = token
    ? await confirmEmailVerification(token)
    : {
        success: false,
        message: "Verification token is missing.",
      }

  return (
    <div className="content-container py-16">
      <div className="max-w-lg">
        <h1 className="text-2xl-semi mb-4">
          {result.success ? "Email verified" : "Verification failed"}
        </h1>
        <p className="text-base-regular text-ui-fg-base mb-6">
          {result.message}
        </p>
        <LocalizedClientLink href="/account" className="underline">
          Go to sign in
        </LocalizedClientLink>
      </div>
    </div>
  )
}
