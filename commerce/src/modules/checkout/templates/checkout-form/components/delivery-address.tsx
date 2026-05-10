import { HttpTypes } from "@medusajs/types"
import { Field, LocationIcon, SectionCard } from "./checkout-ui"

const DeliveryAddress = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  const addr = cart?.shipping_address
  const streetParts = [addr?.address_1, addr?.address_2].filter(Boolean)

  return (
    <SectionCard icon={<LocationIcon />} title="Delivery Address">
      <div className="grid grid-cols-1 gap-4">
        <Field
          label="Street Address"
          id="address_1"
          placeholder="123 Main St, Apt 4B"
          defaultValue={streetParts.join(", ")}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="City"
            id="city"
            placeholder="New York"
            defaultValue={addr?.city ?? ""}
          />
          <Field
            label="ZIP Code"
            id="postal_code"
            placeholder="10001"
            defaultValue={addr?.postal_code ?? ""}
          />
        </div>
      </div>
    </SectionCard>
  )
}

export default DeliveryAddress
