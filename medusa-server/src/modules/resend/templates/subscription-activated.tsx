export type SubscriptionActivatedEmailData = {
  email?: string
  original_email?: string
  order_id?: string
  display_id?: string | number
  action?: "created" | "extended" | "switched" | string
  subscription_id?: string
  plan_title?: string
  duration_months?: number | string | null
  discount_percentage?: number | string | null
  starts_at?: string | null
  ends_at?: string | null
  price_amount?: number | string | null
  currency_code?: string | null
}

const PRIMARY = "#213C02"
const MUTED = "#6B7280"
const BORDER = "#E5E7EB"

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Not available"
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en-AE", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(parsed)
}

const formatMoney = (amount: unknown, currencyCode?: string | null) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: (currencyCode || "AED").toUpperCase()
  }).format(toNumber(amount))

const getActionText = (action?: string) => {
  switch (action) {
    case "extended":
      return "Your subscription has been extended."
    case "switched":
      return "Your subscription plan has been updated."
    default:
      return "Your subscription is now active."
  }
}

const DetailRow = ({
  label,
  value
}: {
  label: string
  value: string | number
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: "16px",
      padding: "14px 0",
      borderBottom: `1px solid ${BORDER}`
    }}
  >
    <span style={{ color: MUTED }}>{label}</span>
    <strong style={{ textAlign: "right" }}>{value}</strong>
  </div>
)

export const SubscriptionActivatedEmail = (
  data: SubscriptionActivatedEmailData
) => {
  const orderNumber = data.display_id
    ? `#${data.display_id}`
    : data.order_id || ""

  return (
    <html>
      <body
        style={{
          margin: 0,
          backgroundColor: "#F6F8F3",
          color: "#111827",
          fontFamily: "Arial, Helvetica, sans-serif"
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
              overflow: "hidden"
            }}
          >
            <div
              style={{
                padding: "24px",
                backgroundColor: PRIMARY,
                color: "#FFFFFF"
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "14px",
                  letterSpacing: "0.08em"
                }}
              >
                ELVAR DUBAI
              </p>
              <h1 style={{ margin: 0, fontSize: "28px", lineHeight: "36px" }}>
                Subscription confirmed
              </h1>
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: "16px",
                  lineHeight: "24px"
                }}
              >
                {getActionText(data.action)}
              </p>
            </div>

            <div style={{ padding: "24px" }}>
              <p
                style={{ margin: "0 0 20px", color: MUTED, lineHeight: "24px" }}
              >
                Your Elvar plan benefits are ready. Your discount will be
                applied automatically to eligible bundle orders while the
                subscription is active.
              </p>

              <div
                style={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  padding: "0 16px"
                }}
              >
                <DetailRow
                  label="Plan"
                  value={data.plan_title || "Subscription plan"}
                />
                <DetailRow
                  label="Duration"
                  value={`${Math.max(0, toNumber(data.duration_months))} month(s)`}
                />
                <DetailRow
                  label="Discount"
                  value={`${Math.max(0, toNumber(data.discount_percentage))}%`}
                />
                <DetailRow label="Starts" value={formatDate(data.starts_at)} />
                <DetailRow label="Ends" value={formatDate(data.ends_at)} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "14px 0"
                  }}
                >
                  <span style={{ color: MUTED }}>Paid</span>
                  <strong style={{ textAlign: "right" }}>
                    {formatMoney(data.price_amount, data.currency_code)}
                  </strong>
                </div>
              </div>

              {orderNumber ? (
                <p
                  style={{ margin: "20px 0 0", color: MUTED, fontSize: "14px" }}
                >
                  Activated from order {orderNumber}.
                </p>
              ) : null}
            </div>

            <div
              style={{
                padding: "16px 24px",
                backgroundColor: "#F9FAF7",
                color: MUTED,
                fontSize: "13px"
              }}
            >
              Questions? Reply to this email or contact info@elvardubai.com.
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
