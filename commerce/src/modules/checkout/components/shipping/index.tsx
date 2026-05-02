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

  const shippingMethods = availableShippingMethods?.filter((sm) => {
    const nameType = sm.name?.toLowerCase() || ""
    return ["standard", "monthly"].some((t) => nameType.includes(t))
  })

  useEffect(() => {
    if (!shippingMethods?.length) {
      return
    }

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
    <div className="bg-white border border-[#E6E6E6] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Heading
          level="h2"
          className={clx(
            "flex items-center gap-3 text-[20px] font-semibold text-[#0A0A0A]",
            {
              "opacity-50 pointer-events-none":
                !isOpen && cart.shipping_methods?.length === 0,
            }
          )}
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FAF5EF]">
            <CheckCircleSolid className="text-[#CD995F]" />
          </span>

          Delivery Method

          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid className="ml-2 text-green-600" />
          )}
        </Heading>

        {!isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <button
              onClick={handleEdit}
              className="text-sm font-medium text-[#CD995F] hover:underline"
            >
              Edit
            </button>
          )}
      </div>

      {isOpen ? (
        <div className="space-y-8">
          {/* Title */}
          <div className="flex flex-col">
            <span className="text-[14px] font-medium text-[#0A0A0A]">
              Shipping method
            </span>
            <span className="text-[14px] text-[#717182]">
              How would you like your order delivered
            </span>
          </div>

          {/* Options */}
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
                    "flex items-center justify-between px-4 py-3 border rounded-lg cursor-pointer mb-2 bg-white",
                    {
                      "border-[#CD995F]": option.id === shippingMethodId,
                      "opacity-50 cursor-not-allowed": isDisabled,
                    }
                  )}
                >
                  <div className="flex items-center gap-3">
                    <MedusaRadio checked={option.id === shippingMethodId} />
                    <span className="text-[14px] text-[#0A0A0A]">
                      {option.name}
                    </span>
                  </div>

                  <span className="text-[14px] text-[#0A0A0A]">
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
            className="w-full h-11 rounded-md bg-[rgb(var(--primary))] text-white text-sm font-medium hover:opacity-90"
          >
            Continue to payment
          </Button>
        </div>
      ) : (
        <div className="text-[14px] text-[#717182]">
          {cart.shipping_methods?.length ? (
            <div className="flex flex-col">
              <Text className="font-medium text-[#0A0A0A] mb-1">
                Method
              </Text>
              <Text>
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