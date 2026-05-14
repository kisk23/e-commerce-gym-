import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"
import { StoreCustomerSubscription } from "@lib/types/subscription"

const CartTemplate = ({
  cart,
  customer,
  activeSubscription,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  activeSubscription?: StoreCustomerSubscription | null
}) => {
  return (
    <div className="py-12 pt-0">
      <div className="bg-gradient-to-r from-primary/5 via-beige/30 to-secondary/10 border-b border-[#e2e0d8] py-16 m">
        <div className="content-container">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete your order and get fresh produce delivered
          </p>
        </div>
      </div>
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
            <div className="flex flex-col bg-white py-6 gap-y-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}

              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-24">
                {cart && cart.region && (
                  <>
                    <div className="bg-white py-6">
                      <Summary
                        cart={cart as any}
                        activeSubscription={activeSubscription ?? null}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
