import { expect, test } from "@playwright/test"
import { e2eEnv, missingEnv } from "./utils/env"

test.describe("bundle pagination", () => {
  test.skip(
    missingEnv(["publishableKey"]).length > 0,
    "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is required for storefront E2E"
  )

  test("paginates custom bundle builder products", async ({ page }) => {
    await page.goto(`/${e2eEnv.countryCode}/bundles/create`)

    const products = page.getByTestId("bundle-builder-product")
    await expect(products.first()).toBeVisible()
    await expect
      .poll(() => products.count(), {
        message: "builder should render no more than one page of products",
      })
      .toBeLessThanOrEqual(9)

    const pagination = page.getByTestId("bundle-builder-pagination")

    if ((await pagination.count()) === 0) {
      expect(e2eEnv.expectPagination).toBe(false)
      return
    }

    await expect(pagination).toBeVisible()
    await expect(page.getByTestId("bundle-builder-pagination-prev")).toBeDisabled()
    await page.getByTestId("bundle-builder-pagination-next").click()
    await expect(page.getByTestId("bundle-builder-pagination-page-2")).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  test("paginates curated bundles", async ({ page }) => {
    await page.goto(`/${e2eEnv.countryCode}/bundles`)

    const bundles = page.getByTestId("bundle-card")

    if ((await bundles.count()) === 0) {
      await expect(page.getByText("No bundles found.")).toBeVisible()
      return
    }

    await expect
      .poll(() => bundles.count(), {
        message: "bundle page should render no more than one page of bundles",
      })
      .toBeLessThanOrEqual(9)

    const pagination = page.getByTestId("bundles-pagination")

    if ((await pagination.count()) === 0) {
      expect(e2eEnv.expectPagination).toBe(false)
      return
    }

    await expect(pagination).toBeVisible()
    await expect(page.getByTestId("bundles-pagination-prev")).toBeDisabled()
    await page.getByTestId("bundles-pagination-next").click()
    await expect(page.getByTestId("bundles-pagination-page-2")).toHaveAttribute(
      "aria-current",
      "page"
    )
  })
})
