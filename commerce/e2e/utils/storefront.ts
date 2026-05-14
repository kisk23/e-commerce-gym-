import type { Page } from "@playwright/test"
import { MoneySnapshot, toMinorUnit } from "./money"

async function readAmount(page: Page, testId: string) {
  const locator = page.getByTestId(testId)

  if ((await locator.count()) === 0) {
    return 0
  }

  return toMinorUnit(await locator.first().getAttribute("data-value"))
}

export async function readCartTotals(page: Page): Promise<MoneySnapshot> {
  return {
    subtotal: await readAmount(page, "cart-subtotal"),
    shipping: await readAmount(page, "cart-shipping"),
    discount: await readAmount(page, "cart-discount"),
    taxes: await readAmount(page, "cart-taxes"),
    total: await readAmount(page, "cart-total"),
  }
}

export async function waitForCartTotals(page: Page) {
  await page.getByTestId("cart-total").waitFor({ state: "visible" })
  return readCartTotals(page)
}
