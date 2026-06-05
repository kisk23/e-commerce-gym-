import { Metadata } from "next"
import ResetPassword from "@modules/account/components/reset-password"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new account password.",
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; redirect?: string }
}) {
  return (
    <div className="content-container py-16 flex justify-center">
      <ResetPassword
        token={searchParams.token}
        redirectTo={searchParams.redirect}
      />
    </div>
  )
}
