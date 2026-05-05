"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { CheckCircleSolid, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Button, clx, Heading, Text } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import MedusaRadio from "@modules/common/components/radio"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})

  const [error, setError] = useState<string | null>(null)

  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  /**
   * ✅ 
   * Uses the option name since metadata isn't available on this type.
   */
  const shippingMethods = availableShippingMethods
  // -----------------------------
  // LOAD CALCULATED PRICES
  // -----------------------------
  useEffect(() => {
    if (!shippingMethods?.length) return

    setIsLoadingPrices(true)

    const promises = shippingMethods
      .filter((sm) => sm.price_type === "calculated")
      .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

    if (!promises.length) {
      setIsLoadingPrices(false)
      return
    }

    Promise.allSettled(promises).then((res) => {
      const pricesMap: Record<string, number> = {}

      res.forEach((r) => {
        if (r.status === "fulfilled" && r.value) {
          pricesMap[r.value.id] = r.value.amount
        }
      })

      setCalculatedPricesMap(pricesMap)
      setIsLoadingPrices(false)
    })
  }, [shippingMethods, cart.id])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (id: string) => {
    setError(null)

    const previousId = shippingMethodId

    setIsLoading(true)
    setShippingMethodId(id)

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(previousId)
        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          Delivery
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid className="text-green-800"/>
          )}
        </Heading>

        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              >
                Edit
              </button>
            </Text>
          )}
      </div>

      {isOpen ? (
        <>
          <div className="grid">
            <div className="flex flex-col">
              <span className="font-medium txt-medium text-ui-fg-base">
                Shipping method
              </span>
              <span className="mb-4 text-ui-fg-muted txt-medium">
                How would you like your order delivered
              </span>
            </div>

            <RadioGroup
              value={shippingMethodId}
              onChange={(v) => v && handleSetShippingMethod(v)}
            >
              {shippingMethods?.map((option) => {
                const isDisabled =
                  option.price_type === "calculated" &&
                  !isLoadingPrices &&
                  typeof calculatedPricesMap[option.id] !== "number"

                return (
                  <Radio
                    key={option.id}
                    value={option.id}
                    disabled={isDisabled}
                    className={clx(
                      "flex items-center justify-between text-small-regular cursor-pointer py-4 border rounded-rounded px-8 mb-2 hover:shadow-borders-interactive-with-active",
                      {
                        "border-ui-border-interactive":
                          option.id === shippingMethodId,
                        "cursor-not-allowed opacity-50": isDisabled,
                      }
                    )}
                  >
                    <div className="flex items-center gap-x-4">
                      <MedusaRadio checked={option.id === shippingMethodId} />
                      <span className="text-base-regular">{option.name}</span>
                    </div>

                    <span className="justify-self-end text-ui-fg-base">
                      {option.price_type === "flat" ? (
                        convertToLocale({
                          amount: option.amount!,
                          currency_code: cart.currency_code,
                        })
                      ) : calculatedPricesMap[option.id] ? (
                        convertToLocale({
                          amount: calculatedPricesMap[option.id],
                          currency_code: cart.currency_code,
                        })
                      ) : isLoadingPrices ? (
                        <Loader />
                      ) : (
                        "-"
                      )}
                    </span>
                  </Radio>
                )
              })}
            </RadioGroup>

            <ErrorMessage error={error} />

            <Button
              size="large"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={!shippingMethodId}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Continue to payment
            </Button>
          </div>
        </>
      ) : (
        <div className="text-small-regular">
          {cart.shipping_methods?.length ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Method
              </Text>
              <Text className="txt-medium text-ui-fg-subtle">
                {cart.shipping_methods.at(-1)!.name}{" "}
                {convertToLocale({
                  amount: cart.shipping_methods.at(-1)!.amount!,
                  currency_code: cart.currency_code,
                })}
              </Text>
            </div>
          ) : null}
        </div>
      )}

      <Divider className="mt-8" />
    </div>
  )
}

export default Shipping
