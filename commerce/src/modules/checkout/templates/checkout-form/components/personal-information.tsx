import { HttpTypes } from "@medusajs/types"
import { Field, PersonIcon, SectionCard } from "./checkout-ui"

const PersonalInformation = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const firstName =
    cart?.shipping_address?.first_name ?? customer?.first_name ?? ""
  const lastName =
    cart?.shipping_address?.last_name ?? customer?.last_name ?? ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ")

  return (
    <SectionCard icon={<PersonIcon />} title="Personal Information">
      <div className="grid grid-cols-1 gap-4">
        <Field
          label="Full Name"
          id="full_name"
          placeholder="John Doe"
          defaultValue={fullName}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Email"
            id="email"
            type="email"
            placeholder="john@example.com"
            defaultValue={cart?.email ?? customer?.email ?? ""}
          />
          <Field
            label="Phone Number"
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            defaultValue={cart?.shipping_address?.phone ?? ""}
          />
        </div>
      </div>
    </SectionCard>
  )
}

export default PersonalInformation
