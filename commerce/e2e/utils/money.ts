export type MoneySnapshot = {
  subtotal: number
  shipping: number
  discount: number
  taxes: number
  total: number
  currencyCode?: string
}

export function toMinorUnit(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value) : 0
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.round(parsed) : 0
  }

  if (value && typeof value === "object") {
    const amount = value as { value?: unknown; raw?: unknown }
    return toMinorUnit(amount.value ?? amount.raw)
  }

  return 0
}

export function normalizeCurrency(value?: string | null) {
  return (value || "").toLowerCase()
}

export function cartMoneySnapshot(cart: any): MoneySnapshot {
  return {
    subtotal: toMinorUnit(cart.item_subtotal ?? cart.subtotal),
    shipping: toMinorUnit(cart.shipping_subtotal ?? cart.shipping_total),
    discount: toMinorUnit(cart.discount_subtotal ?? cart.discount_total),
    taxes: toMinorUnit(cart.tax_total),
    total: toMinorUnit(cart.total),
    currencyCode: normalizeCurrency(cart.currency_code),
  }
}

export function assertMoneyEqual(
  actual: MoneySnapshot,
  expected: MoneySnapshot,
  context: string
) {
  const fields: Array<keyof MoneySnapshot> = [
    "subtotal",
    "shipping",
    "discount",
    "taxes",
    "total",
  ]

  for (const field of fields) {
    if (actual[field] !== expected[field]) {
      throw new Error(
        `${context}: ${field} mismatch. frontend=${actual[field]} backend=${expected[field]}`
      )
    }
  }

  if (
    actual.currencyCode &&
    expected.currencyCode &&
    actual.currencyCode !== expected.currencyCode
  ) {
    throw new Error(
      `${context}: currency mismatch. frontend=${actual.currencyCode} backend=${expected.currencyCode}`
    )
  }
}

export function assertCartFormula(snapshot: MoneySnapshot, context: string) {
  const expectedTotal =
    snapshot.subtotal + snapshot.shipping + snapshot.taxes - snapshot.discount

  if (snapshot.total !== expectedTotal) {
    throw new Error(
      `${context}: total formula mismatch. total=${snapshot.total} subtotal=${snapshot.subtotal} shipping=${snapshot.shipping} taxes=${snapshot.taxes} discount=${snapshot.discount} expected=${expectedTotal}`
    )
  }
}
