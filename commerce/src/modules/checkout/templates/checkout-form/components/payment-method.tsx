import { CardIcon, Field, SectionCard } from "./checkout-ui"

const PaymentMethod = () => {
  return (
    <SectionCard icon={<CardIcon />} title="Payment Method">
      <div className="grid grid-cols-1 gap-4">
        <Field
          label="Card Number"
          id="card_number"
          placeholder="1234 5678 9012 3456"
        />
        <Field
          label="Cardholder Name"
          id="card_holder"
          placeholder="John Doe"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Expiry Date" id="expiry" placeholder="MM/YY" />
          <Field label="CVV" id="cvv" placeholder="•••" />
        </div>
      </div>
    </SectionCard>
  )
}

export default PaymentMethod
