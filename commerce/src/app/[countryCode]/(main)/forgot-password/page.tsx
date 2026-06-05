import { Metadata } from "next"
import ForgotPassword from "@modules/account/components/forgot-password"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link.",
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams

  return (
    <div className="content-container py-16 flex justify-center">
      <ForgotPassword redirectTo={redirect} />
    </div>
  )
}
