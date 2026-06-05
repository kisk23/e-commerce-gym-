export type ResetPasswordEmailData = {
  email?: string
  reset_url?: string
}

const PRIMARY = "#365020"
const MUTED = "#6B7280"
const BORDER = "#E5E7EB"

export const ResetPasswordEmail = (data: ResetPasswordEmailData) => {
  const resetUrl = data.reset_url || "#"

  return (
    <html>
      <body
        style={{
          margin: 0,
          backgroundColor: "#F6F8F3",
          color: "#111827",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{ maxWidth: "640px", margin: "0 auto", padding: "32px 16px" }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: `1px solid ${BORDER}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "24px",
                backgroundColor: PRIMARY,
                color: "#FFFFFF",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                ELVAR DUBAI
              </p>
              <h1 style={{ margin: 0, fontSize: "28px", lineHeight: "36px" }}>
                Reset your password
              </h1>
            </div>

            <div style={{ padding: "24px" }}>
              <p style={{ margin: "0 0 20px", lineHeight: "24px" }}>
                Use this secure link to choose a new password for your account.
              </p>

              <a
                href={resetUrl}
                style={{
                  display: "inline-block",
                  backgroundColor: PRIMARY,
                  color: "#FFFFFF",
                  padding: "12px 18px",
                  borderRadius: "6px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Reset password
              </a>

              <p
                style={{
                  margin: "20px 0 0",
                  color: MUTED,
                  fontSize: "13px",
                  lineHeight: "20px",
                }}
              >
                This link expires soon. If you did not request a password reset,
                you can ignore this email.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
