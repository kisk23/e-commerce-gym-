"use client"

import { isManual, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"
import { useCheckout } from "../checkout-context"

// ─── Button styles ────────────────────────────────────────────────────────────

const btnActive =
  "w-full py-3.5 rounded-xl bg-primary text-white text-sm font-semibold tracking-wide hover:opacity-90 active:scale-[0.99] transition-all duration-150 shadow-md cursor-pointer"

const btnDisabled =
  "w-full py-3.5 rounded-xl bg-primary text-white text-sm font-semibold tracking-wide opacity-60 cursor-not-allowed"

// ─── Form validation ──────────────────────────────────────────────────────────

function validateCheckoutForm(): string[] {
  const errors: string[] = []
  const get = (id: string) =>
    ((document.getElementById(id) as HTMLInputElement)?.value ?? "").trim()

  const fullName = get("full_name")
  const email = get("email")
  const phone = get("phone")
  const address = get("address_1")
  const city = get("city")
  const postalCode = get("postal_code")
  const cardNumber = get("card_number")
  const cardHolder = get("card_holder")
  const expiry = get("expiry")
  const cvv = get("cvv")

  if (!fullName) {
    errors.push("Full name is required.")
  }
  if (!email) {
    errors.push("Email is required.")
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Please enter a valid email address.")
  }
  if (!phone) {
    errors.push("Phone number is required.")
  }
  if (!address) {
    errors.push("Street address is required.")
  }
  if (!city) {
    errors.push("City is required.")
  }
  if (!postalCode) {
    errors.push("ZIP code is required.")
  }
  if (!cardNumber) {
    errors.push("Card number is required.")
  } else if (!/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ""))) {
    errors.push("Please enter a valid 13–19 digit card number.")
  }
  if (!cardHolder) {
    errors.push("Cardholder name is required.")
  }
  if (!expiry) {
    errors.push("Expiry date is required.")
  } else if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    errors.push("Expiry must be in MM/YY format.")
  }
  if (!cvv) {
    errors.push("CVV is required.")
  } else if (!/^\d{3,4}$/.test(cvv)) {
    errors.push("CVV must be 3 or 4 digits.")
  }

  return errors
}

// ─── Root component ───────────────────────────────────────────────────────────

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const { setErrors, clearErrors } = useCheckout()

  /** Validate form first; only call `next` when everything is fine. */
  const runWithValidation = (next: () => void) => {
    const formErrors = validateCheckoutForm()
    if (formErrors.length > 0) {
      setErrors(formErrors)
      document
        .getElementById("checkout-errors")
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    clearErrors()
    next()
  }

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          cart={cart}
          data-testid={dataTestId}
          runWithValidation={runWithValidation}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton
          data-testid={dataTestId}
          runWithValidation={runWithValidation}
        />
      )
    default:
      return (
        <DefaultPaymentButton
          data-testid={dataTestId}
          runWithValidation={runWithValidation}
        />
      )
  }
}

// ─── Stripe variant ───────────────────────────────────────────────────────────

const StripePaymentButton = ({
  cart,
  "data-testid": dataTestId,
  runWithValidation,
}: {
  cart: HttpTypes.StoreCart
  "data-testid"?: string
  runWithValidation: (_next: () => void) => void
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const stripe = useStripe()
  const elements = useElements()

  const handlePayment = () => {
    runWithValidation(async () => {
      setSubmitting(true)
      if (!stripe || !elements || !cart) {
        setSubmitting(false)
        return
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name:
                (cart.billing_address?.first_name || "") +
                " " +
                (cart.billing_address?.last_name || ""),
              address: {
                city: cart.billing_address?.city ?? undefined,
                country: cart.billing_address?.country_code ?? undefined,
                line1: cart.billing_address?.address_1 ?? undefined,
                line2: cart.billing_address?.address_2 ?? undefined,
                postal_code: cart.billing_address?.postal_code ?? undefined,
                state: cart.billing_address?.province ?? undefined,
              },
              email: cart.email ?? undefined,
              phone: cart.billing_address?.phone ?? undefined,
            },
          },
        },
        redirect: "if_required",
      })

      if (error) {
        const pi = error.payment_intent
        if (
          (pi && pi.status === "requires_capture") ||
          (pi && pi.status === "succeeded")
        ) {
          await placeOrder().catch((err) => setErrorMessage(err.message))
        }
        setErrorMessage(error.message || null)
        setSubmitting(false)
        return
      }

      if (
        paymentIntent?.status === "requires_capture" ||
        paymentIntent?.status === "succeeded"
      ) {
        await placeOrder()
          .catch((err) => setErrorMessage(err.message))
          .finally(() => setSubmitting(false))
      } else {
        setSubmitting(false)
      }
    })
  }

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={submitting}
        data-testid={dataTestId}
        className={submitting ? btnDisabled : btnActive}
      >
        {submitting ? "Processing…" : "Place Order"}
      </button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

// ─── Manual variant ───────────────────────────────────────────────────────────

const ManualTestPaymentButton = ({
  "data-testid": dataTestId,
  runWithValidation,
}: {
  "data-testid"?: string
  runWithValidation: (_next: () => void) => void
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = () => {
    runWithValidation(() => {
      setSubmitting(true)
      placeOrder()
        .catch((err) => setErrorMessage(err.message))
        .finally(() => setSubmitting(false))
    })
  }

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={submitting}
        data-testid={dataTestId}
        className={submitting ? btnDisabled : btnActive}
      >
        {submitting ? "Processing…" : "Place Order"}
      </button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

// ─── Default / fallback variant ───────────────────────────────────────────────

const DefaultPaymentButton = ({
  "data-testid": dataTestId,
  runWithValidation,
}: {
  "data-testid"?: string
  runWithValidation: (_next: () => void) => void
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = () => {
    runWithValidation(() => {
      setSubmitting(true)
      placeOrder()
        .catch((err) => setErrorMessage(err.message))
        .finally(() => setSubmitting(false))
    })
  }

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={submitting}
        data-testid={dataTestId}
        className={submitting ? btnDisabled : btnActive}
      >
        {submitting ? "Processing…" : "Place Order"}
      </button>
      <ErrorMessage
        error={errorMessage}
        data-testid="default-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
