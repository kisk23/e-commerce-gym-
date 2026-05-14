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
  pricing_segments?: string | null
  price_amount?: number | string | null
  currency_code?: string | null
}

type PricingSegment = {
  plan_id?: string
  plan_title?: string
  starts_at?: string
  ends_at?: string
  duration_months?: number
  discount_percentage?: number
  price_amount?: number
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

const getTime = (value?: string | null) => {
  if (!value) {
    return 0
  }

  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

const formatDuration = (startMs: number, endMs: number) => {
  const days = Math.max(0, Math.round((endMs - startMs) / 86_400_000))

  if (days >= 60) {
    const months = Math.round((days / 30) * 10) / 10
    return `${months} month(s)`
  }

  return `${days} day(s)`
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

const parsePricingSegments = (value?: string | null): PricingSegment[] => {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getSegmentRows = (data: SubscriptionActivatedEmailData) => {
  const segments = parsePricingSegments(data.pricing_segments)
  const fallbackSegments =
    segments.length > 0
      ? segments
      : [
          {
            plan_title: data.plan_title,
            starts_at: data.starts_at || undefined,
            ends_at: data.ends_at || undefined,
            duration_months: toNumber(data.duration_months),
            discount_percentage: toNumber(data.discount_percentage),
            price_amount: toNumber(data.price_amount)
          }
        ]

  const pivotMs = Date.now()

  return fallbackSegments
    .map((segment, index) => {
      const startsAtMs = getTime(segment.starts_at)
      const endsAtMs = getTime(segment.ends_at)
      const activeStartMs = Math.max(startsAtMs, pivotMs)
      const durationMs = Math.max(0, endsAtMs - activeStartMs)

      return {
        label:
          index === fallbackSegments.length - 1
            ? "New purchased plan"
            : "Remaining time from previous plan",
        title: segment.plan_title || "Subscription plan",
        starts_at: segment.starts_at || "",
        ends_at: segment.ends_at || "",
        durationMs,
        durationLabel: formatDuration(activeStartMs, endsAtMs),
        discount: Math.max(0, toNumber(segment.discount_percentage))
      }
    })
    .filter((segment) => segment.durationMs > 0)
}

const getWeightedDiscountText = (
  rows: ReturnType<typeof getSegmentRows>,
  effectiveDiscount: number
) => {
  if (!rows.length) {
    return `${effectiveDiscount}%`
  }

  if (rows.length === 1) {
    return `${rows[0].discount}% for ${rows[0].durationLabel} = ${effectiveDiscount}%`
  }

  const parts = rows.map((row) => `${row.durationLabel} x ${row.discount}%`)

  return `(${parts.join(" + ")}) / total remaining time = ${effectiveDiscount}%`
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
  const segmentRows = getSegmentRows(data)
  const effectiveDiscount = Math.max(0, toNumber(data.discount_percentage))

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

              {segmentRows.length ? (
                <div style={{ marginTop: "24px" }}>
                  <h2 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                    Discount calculation
                  </h2>
                  <p
                    style={{
                      margin: "0 0 12px",
                      color: MUTED,
                      fontSize: "14px",
                      lineHeight: "22px"
                    }}
                  >
                    If you had remaining subscription time, it stays active
                    first. Your new plan starts after that remaining time. The
                    cart discount is the weighted average across the remaining
                    subscription timeline.
                  </p>
                  <div
                    style={{
                      border: `1px solid ${BORDER}`,
                      borderRadius: "8px",
                      padding: "0 16px"
                    }}
                  >
                    {segmentRows.map((segment, index) => (
                      <div
                        key={`${segment.title}-${segment.starts_at}-${index}`}
                        style={{
                          padding: "14px 0",
                          borderBottom:
                            index === segmentRows.length - 1
                              ? "none"
                              : `1px solid ${BORDER}`
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: 700 }}>
                          {segment.label}
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0",
                            color: MUTED,
                            fontSize: "13px",
                            lineHeight: "20px"
                          }}
                        >
                          {segment.title}: {segment.durationLabel} at{" "}
                          {segment.discount}% ({formatDate(segment.starts_at)}{" "}
                          to {formatDate(segment.ends_at)})
                        </p>
                      </div>
                    ))}
                  </div>
                  <p
                    style={{
                      margin: "12px 0 0",
                      color: MUTED,
                      fontSize: "13px",
                      lineHeight: "20px"
                    }}
                  >
                    Effective discount:{" "}
                    {getWeightedDiscountText(segmentRows, effectiveDiscount)}
                  </p>
                </div>
              ) : null}

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
