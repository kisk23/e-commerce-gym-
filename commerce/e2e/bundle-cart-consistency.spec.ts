import { expect, test } from "@playwright/test"
import { e2eEnv, missingEnv } from "./utils/env"
import {
  addShippingMethod,
  findBundleForE2E,
  getCartIdFromCookies,
  initiatePaymentSession,
  listPaymentProviders,
  listShippingOptions,
  paymentIntentClientSecret,
  retrieveCart,
  updateCart,
} from "./utils/medusa-api"
import {
  assertCartFormula,
  assertMoneyEqual,
  cartMoneySnapshot,
  normalizeCurrency,
  toMinorUnit,
} from "./utils/money"
import { retrievePaymentIntent, toStripeAmount } from "./utils/stripe-api"
import { waitForCartTotals } from "./utils/storefront"

const WEIGHT_STEP_G = 100

async function findBundleCard(page: any, bundleId: string) {
  const card = page.locator(`[data-testid="bundle-view"][data-bundle-id="${bundleId}"]`)

  for (let pageNumber = 1; pageNumber <= 20; pageNumber++) {
    if ((await card.count()) > 0) {
      return card.first()
    }

    const next = page.getByTestId("bundles-pagination-next")
    if ((await next.count()) === 0 || (await next.isDisabled())) {
      break
    }

    await next.click()
  }

  throw new Error(`Bundle ${bundleId} was not visible on the bundle page`)
}

async function addBundleToCartFromStorefront({
  context,
  page,
  request,
}: {
  context: any
  page: any
  request: any
}) {
  const bundle = await findBundleForE2E(request)

  await page.goto(`/${e2eEnv.countryCode}/bundles`)
  const card = await findBundleCard(page, bundle.id)
  await card.getByTestId("add-bundle-to-cart").click()

  await expect(page.getByRole("status")).toContainText(/Added|cart/i)

  await expect
    .poll(() => getCartIdFromCookies(context), {
      message: "bundle add should create or reuse a Medusa cart cookie",
    })
    .not.toBe("")

  const cartId = await getCartIdFromCookies(context)
  const cart = await retrieveCart(request, cartId)

  return {
    bundle,
    cartId,
    cart,
  }
}

test.describe("bundle cart consistency", () => {
  test.skip(
    missingEnv(["publishableKey"]).length > 0,
    "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY is required for Medusa-backed E2E"
  )

  test("verifies bundle pricing math and cart totals after adding a bundle", async ({
    context,
    page,
    request,
  }) => {
    const { bundle, cartId, cart: cartAfterAdd } = await addBundleToCartFromStorefront({
      context,
      page,
      request,
    })
    const bundleItems = (cartAfterAdd.items || []).filter((item: any) => {
      return item.metadata?.bundle_id === bundle.id
    })

    expect(bundleItems.length).toBe(bundle.items.length)
    expect(normalizeCurrency(cartAfterAdd.currency_code)).toBe(
      normalizeCurrency(bundle.currency_code || cartAfterAdd.currency_code)
    )

    const operationIds = new Set(
      bundleItems.map((item: any) => item.metadata?.bundle_operation_id)
    )
    expect(operationIds.size).toBe(1)

    const duplicateItemIds = bundleItems
      .map((item: any) => item.id)
      .filter((id: string, index: number, all: string[]) => all.indexOf(id) !== index)
    expect(duplicateItemIds).toEqual([])

    for (const lineItem of bundleItems) {
      const metadata = lineItem.metadata || {}
      const bundleItem = (bundle.items || []).find((item: any) => {
        return item.variant_id === lineItem.variant_id
      })

      expect(bundleItem, `bundle item for variant ${lineItem.variant_id}`).toBeTruthy()
      expect(metadata.bundle_title).toBe(bundle.title)
      expect(metadata.bundle_type).toBe("admin")
      expect(toMinorUnit(metadata.bundle_discount_percentage)).toBe(
        toMinorUnit(bundle.discount_percentage)
      )
      expect(toMinorUnit(metadata.bundle_item_units)).toBe(
        toMinorUnit(lineItem.quantity)
      )
      expect(toMinorUnit(metadata.selected_weight_unit_g)).toBe(WEIGHT_STEP_G)
      expect(toMinorUnit(metadata.selected_weight_g)).toBe(
        toMinorUnit(lineItem.quantity) * WEIGHT_STEP_G
      )

      if (bundleItem) {
        const itemCount = Math.max(1, Math.round(Number(bundleItem.quantity) || 1))
        const itemWeight = Math.max(0, Number(bundleItem.weight) || 0)
        const weightUnits =
          itemWeight > 0 ? Math.max(1, Math.round(itemWeight / WEIGHT_STEP_G)) : 1
        const expectedQuantity = weightUnits * itemCount

        expect(toMinorUnit(lineItem.quantity)).toBe(expectedQuantity)
      }
    }

    const baseTotal = bundleItems.reduce((sum: number, item: any) => {
      return sum + toMinorUnit(item.unit_price) * toMinorUnit(item.quantity)
    }, 0)
    const bundleAdjustmentTotal = bundleItems.reduce((sum: number, item: any) => {
      return (
        sum +
        (item.adjustments || [])
          .filter((adjustment: any) => adjustment.code === `BUNDLE_${bundle.id}`)
          .reduce((inner: number, adjustment: any) => {
            return inner + toMinorUnit(adjustment.amount)
          }, 0)
      )
    }, 0)
    const expectedBundleDiscount = Math.round(
      (baseTotal * Number(bundle.discount_percentage || 0)) / 100
    )

    expect(baseTotal).toBeGreaterThan(0)
    expect(bundleAdjustmentTotal).toBe(expectedBundleDiscount)
    expect(toMinorUnit(cartAfterAdd.item_subtotal ?? cartAfterAdd.subtotal)).toBe(
      baseTotal
    )
    expect(toMinorUnit(cartAfterAdd.discount_subtotal)).toBe(
      expectedBundleDiscount
    )
    assertCartFormula(cartMoneySnapshot(cartAfterAdd), "backend bundle cart")

    await page.goto(`/${e2eEnv.countryCode}/cart`)

    const frontendTotals = await waitForCartTotals(page)
    const backendTotals = cartMoneySnapshot(await retrieveCart(request, cartId))

    expect(frontendTotals.subtotal).toBe(baseTotal)
    expect(frontendTotals.discount).toBe(expectedBundleDiscount)
    assertCartFormula(frontendTotals, "frontend bundle cart")
    assertCartFormula(backendTotals, "backend bundle cart after render")
    assertMoneyEqual(frontendTotals, backendTotals, "bundle cart totals")
  })

  test("syncs payable bundle cart total to Stripe PaymentIntent amount", async ({
    context,
    page,
    request,
  }) => {
    test.skip(!e2eEnv.stripeApiKey, "STRIPE_API_KEY is required for Stripe sync checks")

    const { cartId, cart } = await addBundleToCartFromStorefront({
      context,
      page,
      request,
    })
    const regionId = cart.region_id || cart.region?.id
    const paymentProviders = await listPaymentProviders(request, regionId)
    const stripeProvider = paymentProviders.find((provider: any) =>
      String(provider.id || "").includes("stripe")
    )

    test.skip(!stripeProvider, "No Stripe payment provider is linked to this cart region")

    await updateCart(request, cartId, {
      email: "playwright-bundle-finance@example.com",
      shipping_address: {
        first_name: "Playwright",
        last_name: "Finance",
        address_1: "Financial Test Street 1",
        city: "Dubai",
        country_code: e2eEnv.countryCode,
        postal_code: "00000",
        phone: "+971500000000",
      },
      billing_address: {
        first_name: "Playwright",
        last_name: "Finance",
        address_1: "Financial Test Street 1",
        city: "Dubai",
        country_code: e2eEnv.countryCode,
        postal_code: "00000",
        phone: "+971500000000",
      },
    })

    const shippingOptions = await listShippingOptions(request, cartId)
    const shippingOption = shippingOptions[0]

    test.skip(!shippingOption, "No shipping option is available for this cart")

    await addShippingMethod(request, cartId, shippingOption.id)

    const payableCart = await retrieveCart(request, cartId)
    const payableTotals = cartMoneySnapshot(payableCart)
    assertCartFormula(payableTotals, "payable backend bundle cart")

    await initiatePaymentSession(request, payableCart, stripeProvider.id)

    const cartWithPayment = await retrieveCart(request, cartId)
    const clientSecret = paymentIntentClientSecret(cartWithPayment)
    const paymentIntent = await retrievePaymentIntent(request, clientSecret)

    expect(paymentIntent).toBeTruthy()
    expect(paymentIntent.amount).toBe(
      toStripeAmount(toMinorUnit(cartWithPayment.total), cartWithPayment.currency_code)
    )
    expect(paymentIntent.currency).toBe(normalizeCurrency(cartWithPayment.currency_code))
  })
})
