import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import Image from "next/image"
import NavLinks from "@modules/layout/components/nav-links"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])
  
  

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex flex-wrap items-center justify-between w-full h-full text-small-regular">
          <div className="flex items-center h-full py-3 w-1/2 md:w-1/4">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-ui-fg-base capitalize"
              data-testid="nav-store-link"
            >
              <Image src="/Logo.svg" alt="Logo" width={120} height={60} />
              <p className="text-sm text-secondary">Food Stuff Trading</p>
            </LocalizedClientLink>
          </div>

          <div className="flex md:hidden h-full justify-content-end items-center">
            <div className="h-full">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
              />
            </div>
          </div>

          <div className="hidden md:flex items-center h-full justify-center mx-auto md:w-1/2 w-full">
            <NavLinks />
          </div>

          <div className="hidden md:flex items-center w-1/2 md:w-1/4 gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  {/* <ShoppingCart/> */}
                  Cart
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
