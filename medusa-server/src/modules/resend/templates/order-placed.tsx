type OrderEmailItem = {
  title?: string | null
  product_title?: string | null
  variant_title?: string | null
  quantity?: number | string | null
  total?: number | string | null
  unit_price?: number | string | null
}

type Address = {
  first_name?: string | null
  last_name?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
}

export type OrderPlacedEmailData = {
  order_id?: string
  display_id?: string | number
  total?: number | string | null
  currency_code?: string | null
  email?: string
  original_email?: string
  items?: OrderEmailItem[]
  shipping_address?: Address | null
}

const PRIMARY = "#213C02"
const MUTED = "#6B7280"
const BORDER = "#E5E7EB"

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatMoney = (amount: unknown, currencyCode?: string | null) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: (currencyCode || "AED").toUpperCase()
  }).format(toNumber(amount))

const formatAddress = (address?: Address | null) =>
  [
    [address?.first_name, address?.last_name].filter(Boolean).join(" "),
    address?.address_1,
    address?.address_2,
    [address?.city, address?.province, address?.postal_code]
      .filter(Boolean)
      .join(", "),
    address?.country_code?.toUpperCase(),
    address?.phone
  ].filter(Boolean)

const pageStyle = {
  margin: 0,
  backgroundColor: "#F6F8F3",
  color: "#111827",
  fontFamily: "Arial, Helvetica, sans-serif"
}

const containerStyle = {
  maxWidth: "640px",
  margin: "0 auto",
  padding: "32px 16px"
}

const cardStyle = {
  backgroundColor: "#FFFFFF",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  overflow: "hidden"
}

const sectionStyle = {
  padding: "24px"
}

export const OrderPlacedEmail = (data: OrderPlacedEmailData) => {
  const orderNumber = data.display_id
    ? `#${data.display_id}`
    : data.order_id || ""
  const items = data.items || []
  const addressLines = formatAddress(data.shipping_address)

  return (
    <html>
      <body style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <div
              style={{
                ...sectionStyle,
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
                Your order is confirmed
              </h1>
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: "16px",
                  lineHeight: "24px"
                }}
              >
                Thanks for ordering from Elvar. We received your order{" "}
                {orderNumber}.
              </p>
            </div>

            <div style={sectionStyle}>
              <p style={{ margin: "0 0 16px", color: MUTED, fontSize: "14px" }}>
                We will prepare your items and notify you when your order moves
                forward.
              </p>

              <div
                style={{ border: `1px solid ${BORDER}`, borderRadius: "8px" }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderBottom: `1px solid ${BORDER}`
                  }}
                >
                  <strong>Order Summary</strong>
                </div>
                <div style={{ padding: "16px" }}>
                  {items.length ? (
                    items.map((item, index) => (
                      <div
                        key={`${item.title || item.product_title || "item"}-${index}`}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "16px",
                          paddingBottom:
                            index === items.length - 1 ? 0 : "12px",
                          marginBottom: index === items.length - 1 ? 0 : "12px",
                          borderBottom:
                            index === items.length - 1
                              ? "none"
                              : `1px solid ${BORDER}`
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: 700 }}>
                            {item.title || item.product_title || "Item"}
                          </p>
                          <p
                            style={{
                              margin: "4px 0 0",
                              color: MUTED,
                              fontSize: "13px"
                            }}
                          >
                            {item.variant_title
                              ? `${item.variant_title} - `
                              : ""}
                            Qty {toNumber(item.quantity)}
                          </p>
                        </div>
                        <div style={{ whiteSpace: "nowrap" }}>
                          {formatMoney(
                            item.total ??
                              toNumber(item.unit_price) *
                                toNumber(item.quantity),
                            data.currency_code
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, color: MUTED }}>
                      Order items will appear in your account.
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "16px",
                    borderTop: `1px solid ${BORDER}`,
                    fontWeight: 700
                  }}
                >
                  <span>Total</span>
                  <span>{formatMoney(data.total, data.currency_code)}</span>
                </div>
              </div>

              {addressLines.length ? (
                <div style={{ marginTop: "24px" }}>
                  <h2 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                    Delivery Details
                  </h2>
                  {addressLines.map((line) => (
                    <p key={line} style={{ margin: "2px 0", color: MUTED }}>
                      {line}
                    </p>
                  ))}
                </div>
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
