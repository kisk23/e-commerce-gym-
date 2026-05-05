"use client"

import { RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession, placeOrder } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useElements, useStripe } from "@stripe/react-stripe-js"

const isRedirectError = (err: unknown) =>
  typeof (err as { digest?: unknown })?.digest === "string" &&
  ((err as { digest?: string }).digest || "").startsWith("NEXT_REDIRECT")

const StripeImmediateOrderButton = ({
  cart,
  disabled,
  setError,
}: {
  cart: any
  disabled: boolean
  setError: (_error: string | null) => void
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  const handlePayment = async () => {
    setSubmitting(true)
    setError(null)

    try {
      if (!stripe || !elements || !cart) {
        setError("Payment form is not ready yet.")
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
          await placeOrder(cart.id)
          return
        }

        setError(error.message || "Payment authorization failed.")
        setSubmitting(false)
        return
      }

      if (
        (paymentIntent && paymentIntent.status === "requires_capture") ||
        paymentIntent?.status === "succeeded"
      ) {
        await placeOrder(cart.id)
        return
      }

      setError("Payment wasn't authorized. Please try again.")
      setSubmitting(false)
    } catch (err: any) {
      if (isRedirectError(err)) {
        throw err
      }

      setError(err?.message || "Could not place order.")
      setSubmitting(false)
    }
  }

  return (
    <Button
      size="large"
      className="mt-6 w-full h-11 rounded-md bg-[rgb(var(--primary))] text-white text-sm font-medium hover:bg-primary/80"
      onClick={handlePayment}
      isLoading={submitting}
      disabled={disabled || submitting}
      data-testid="submit-payment-button"
    >
      Pay and place order
    </Button>
  )
}

const Payment = ({
  cart,
  availablePaymentMethods,
  mode = "default",
}: {
  cart: any
  availablePaymentMethods: any[]
  mode?: "default" | "subscription"
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    if (!paidByGiftcard && !selectedPaymentMethod) {
      setError("Please select a payment method.")
      return
    }

    if (isStripeLike(selectedPaymentMethod) && !cardComplete) {
      setError("Please complete your card details.")
      return
    }

    setIsLoading(true)
    try {
      const hasMatchingActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!paidByGiftcard && !hasMatchingActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })

        if (mode === "subscription" && isStripeLike(selectedPaymentMethod)) {
          router.refresh()
          return
        }
      }

      if (mode === "subscription") {
        if (isStripeLike(selectedPaymentMethod)) {
          setError("Payment form is loading. Please click again.")
          return
        }

        await placeOrder(cart.id)
        return
      }

      return router.push(pathname + "?" + createQueryString("step", "review"), {
        scroll: false,
      })
    } catch (err: any) {
      if (isRedirectError(err)) {
        throw err
      }
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const shouldUseStripeImmediateOrderButton =
    mode === "subscription" &&
    !paidByGiftcard &&
    isStripeLike(selectedPaymentMethod) &&
    activeSession?.provider_id === selectedPaymentMethod

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Heading
          level="h2"
          className={clx(
            "flex items-center gap-3 text-[20px] font-semibold text-[#0A0A0A]",
            {
              "opacity-50 pointer-events-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E9ECE6]">
            <CreditCard className="text-primary" />
          </span>

          Payment Method

          {!isOpen && paymentReady && (
            <CheckCircleSolid className="ml-2 text-green-600" />
          )}
        </Heading>

        {!isOpen && paymentReady && (
          <button
            onClick={handleEdit}
            className="text-sm font-medium text-[#4b6af1] hover:underline"
            data-testid="edit-payment-button"
          >
            Edit
          </button>
        )}
      </div>

      {/* OPEN STATE */}
      <div className={isOpen ? "block" : "hidden"}>
        {!paidByGiftcard && availablePaymentMethods?.length && (
          <RadioGroup
            value={selectedPaymentMethod}
            onChange={(value: string) => setPaymentMethod(value)}
            className="space-y-3"
          >
            {availablePaymentMethods.map((paymentMethod) => (
              <div key={paymentMethod.id}>
                {isStripeLike(paymentMethod.id) ? (
                  <StripeCardContainer
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={selectedPaymentMethod}
                    paymentInfoMap={paymentInfoMap}
                    setCardBrand={setCardBrand}
                    setError={setError}
                    setCardComplete={setCardComplete}
                  />
                ) : (
                  <PaymentContainer
                    paymentInfoMap={paymentInfoMap}
                    paymentProviderId={paymentMethod.id}
                    selectedPaymentOptionId={selectedPaymentMethod}
                  />
                )}
              </div>
            ))}
          </RadioGroup>
        )}

        {paidByGiftcard && (
          <div className="flex flex-col">
            <Text className="text-[14px] font-medium text-[#0A0A0A] mb-1">
              Payment method
            </Text>
            <Text className="text-[14px] text-[#717182]">
              Gift card
            </Text>
          </div>
        )}

        <ErrorMessage error={error} />

        {shouldUseStripeImmediateOrderButton ? (
          <StripeImmediateOrderButton
            cart={cart}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            setError={setError}
          />
        ) : (
          <Button
            size="large"
            className="mt-6 w-full h-11 rounded-md bg-[rgb(var(--primary))] text-white text-sm font-medium hover:bg-primary/80"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? "Enter payment details"
              : mode === "subscription"
              ? "Pay and place order"
              : "Continue to review"}
          </Button>
        )}
      </div>

      {/* CLOSED STATE */}
      <div className={isOpen ? "hidden" : "block"}>
        {cart && paymentReady && activeSession ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <Text className="text-[14px] font-medium text-[#0A0A0A] mb-1">
                Payment method
              </Text>
              <Text className="text-[14px] text-[#717182]">
                {paymentInfoMap[activeSession?.provider_id]?.title ||
                  activeSession?.provider_id}
              </Text>
            </div>

            <div>
              <Text className="text-[14px] font-medium text-[#0A0A0A] mb-1">
                Payment details
              </Text>
              <div className="flex items-center gap-2 text-[14px] text-[#717182]">
                <Container className="flex items-center h-7 w-fit p-2 bg-[#F3F3F5] rounded-md">
                  {paymentInfoMap[selectedPaymentMethod]?.icon || (
                    <CreditCard />
                  )}
                </Container>
                <Text>
                  {isStripeLike(selectedPaymentMethod) && cardBrand
                    ? cardBrand
                    : "Payment details will appear at checkout"}
                </Text>
              </div>
            </div>
          </div>
        ) : paidByGiftcard ? (
          <div>
            <Text className="text-[14px] font-medium text-[#0A0A0A] mb-1">
              Payment method
            </Text>
            <Text className="text-[14px] text-[#717182]">
              Gift card
            </Text>
          </div>
        ) : null}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
