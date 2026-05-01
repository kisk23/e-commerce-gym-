import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import DeliveryAddress from "./components/delivery-address"
// import OrderSummary from "./components/order-summary"
import PaymentMethod from "./components/payment-method"
import PersonalInformation from "./components/personal-information"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
    <div className="flex flex-col gap-5 w-full items-center justify-center mb-5">
      <PersonalInformation cart={cart} customer={customer} />
      <DeliveryAddress cart={cart} />
      <PaymentMethod />
    </div>
  )
}
