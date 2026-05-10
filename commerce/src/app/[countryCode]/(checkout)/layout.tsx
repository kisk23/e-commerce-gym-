import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import Image from "next/image"

import { CheckoutHeader } from "@/modules/checkout/components/checkout-header"
import SubscriptionExitRestorer from "@modules/checkout/components/subscription-exit-restorer"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white relative small:min-h-screen">
      <SubscriptionExitRestorer />
      <div className=" bg-white border-b ">
        <nav className="flex h-full p-2 items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-ui-fg-base flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />

            <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base ">
              Back to shopping cart
            </span>

            <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="txt-compact-xlarge-plus text-ui-fg-subtle hover:text-ui-fg-base uppercase flex flex-col items-center justify-center"
            data-testid="store-link"
          >
            <Image src="/Logo.svg" alt="Logo" width={120} height={60} />
            <p className="text-sm text-secondary">Food Stuff Trading</p>
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        <CheckoutHeader />
        {children}
      </div>
    </div>
  )
}
