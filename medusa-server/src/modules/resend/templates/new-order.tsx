import type { OrderPlacedEmailData } from "./order-placed"

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

export const NewOrderEmail = (data: OrderPlacedEmailData) => {
  const orderNumber = data.display_id
    ? `#${data.display_id}`
    : data.order_id || ""
  const items = data.items || []

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
            <div style={{ padding: "24px", borderTop: `6px solid ${PRIMARY}` }}>
              <p
                style={{
                  margin: "0 0 8px",
                  color: PRIMARY,
                  fontSize: "14px",
                  fontWeight: 700,
                  letterSpacing: "0.08em"
                }}
              >
                NEW ORDER
              </p>
              <h1 style={{ margin: 0, fontSize: "28px", lineHeight: "36px" }}>
                Order {orderNumber} is ready to review
              </h1>
              <p
                style={{ margin: "12px 0 0", color: MUTED, lineHeight: "24px" }}
              >
                Customer email:{" "}
                {data.original_email || data.email || "Not available"}
              </p>
            </div>

            <div style={{ padding: "0 24px 24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "16px",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  fontWeight: 700
                }}
              >
                <span>Total</span>
                <span>{formatMoney(data.total, data.currency_code)}</span>
              </div>

              <h2 style={{ margin: "24px 0 12px", fontSize: "16px" }}>Items</h2>
              {items.length ? (
                <div
                  style={{ border: `1px solid ${BORDER}`, borderRadius: "8px" }}
                >
                  {items.map((item, index) => (
                    <div
                      key={`${item.title || item.product_title || "item"}-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        padding: "14px 16px",
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
                          {item.variant_title ? `${item.variant_title} - ` : ""}
                          Qty {toNumber(item.quantity)}
                        </p>
                      </div>
                      <span style={{ whiteSpace: "nowrap" }}>
                        {formatMoney(
                          item.total ??
                            toNumber(item.unit_price) * toNumber(item.quantity),
                          data.currency_code
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: MUTED }}>
                  No line items were included in the event payload.
                </p>
              )}

              <p style={{ margin: "24px 0 0", color: MUTED, fontSize: "13px" }}>
                Open Medusa Admin to process this order.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
