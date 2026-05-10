"use client"

import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import { CheckCircleSolid, User } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text, useToggleState } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <div className="bg-white border border-[#E6E6E6] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Heading
          level="h2"
          className="flex items-center gap-3 text-[20px] font-semibold text-[#0A0A0A]"
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E9ECE6]">
            <User className="text-green-800" />
          </span>
          Personal Information
          {!isOpen && <CheckCircleSolid className="ml-2 text-green-600" />}
        </Heading>

        {!isOpen && cart?.shipping_address && (
          <button
            onClick={handleEdit}
            className="text-sm font-medium text-[#4b6af1] hover:underline"
            data-testid="edit-address-button"
          >
            Edit
          </button>
        )}
      </div>

      {isOpen ? (
        <form action={formAction}>
          <div className="space-y-8">
            {/* Shipping */}
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
            />

            {/* Billing */}
            {!sameAsBilling && (
              <div>
                <Heading
                  level="h2"
                  className="text-[18px] font-semibold text-[#0A0A0A] mb-4"
                >
                  Billing Address
                </Heading>

                <BillingAddress cart={cart} />
              </div>
            )}

            <SubmitButton
              className="mt-4 w-full h-11 rounded-md bg-[rgb(var(--primary))] text-white text-sm font-medium hover:bg-primary/80"
              data-testid="submit-address-button"
            >
              Continue to delivery
            </SubmitButton>

            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div className="text-sm text-[#717182]">
          {cart && cart.shipping_address ? (
            <div className="grid grid-cols-3 gap-8">
              {/* Shipping */}
              <div data-testid="shipping-address-summary">
                <Text className="font-medium text-[#0A0A0A] mb-1">
                  Shipping Address
                </Text>
                <Text>
                  {cart.shipping_address.first_name}{" "}
                  {cart.shipping_address.last_name}
                </Text>
                <Text>
                  {cart.shipping_address.address_1}{" "}
                  {cart.shipping_address.address_2}
                </Text>
                <Text>
                  {cart.shipping_address.postal_code},{" "}
                  {cart.shipping_address.city}
                </Text>
                <Text>{cart.shipping_address.country_code?.toUpperCase()}</Text>
              </div>

              {/* Contact */}
              <div data-testid="shipping-contact-summary">
                <Text className="font-medium text-[#0A0A0A] mb-1">Contact</Text>
                <Text>{cart.shipping_address.phone}</Text>
                <Text>{cart.email}</Text>
              </div>

              {/* Billing */}
              <div data-testid="billing-address-summary">
                <Text className="font-medium text-[#0A0A0A] mb-1">
                  Billing Address
                </Text>

                {sameAsBilling ? (
                  <Text>Billing and delivery address are the same.</Text>
                ) : (
                  <>
                    <Text>
                      {cart.billing_address?.first_name}{" "}
                      {cart.billing_address?.last_name}
                    </Text>
                    <Text>
                      {cart.billing_address?.address_1}{" "}
                      {cart.billing_address?.address_2}
                    </Text>
                    <Text>
                      {cart.billing_address?.postal_code},{" "}
                      {cart.billing_address?.city}
                    </Text>
                    <Text>
                      {cart.billing_address?.country_code?.toUpperCase()}
                    </Text>
                  </>
                )}
              </div>
            </div>
          ) : (
            <Spinner />
          )}
        </div>
      )}

      <Divider className="mt-8" />
    </div>
  )
}

export default Addresses
