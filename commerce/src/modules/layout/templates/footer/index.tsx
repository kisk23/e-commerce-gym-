import { Facebook } from "@medusajs/icons"
import { Text } from "@medusajs/ui"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"
import Image from "next/image"

export default async function Footer() {
  return (
    <footer className="border-t border-ui-border-base w-full text-white bg-primary">
      <div className="content-container flex flex-col w-full">
        <div className="flex flex-col gap-y-6 xsmall:flex-row items-start justify-between pt-10 pb-12 border-b-2 border-secondary/20">
          <div>
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus uppercase"
            >
              <Image src="/footer.svg" alt="Logo" width={120} height={100} />
            </LocalizedClientLink>
            <p className="text-white/70 mt-8">
              Shop smart, eat healthy. Your nutrition goals made simple.
            </p>
          </div>
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-3">
            <div className="flex flex-col gap-y-2">
              <span className="txt-large-plus">Quick Links</span>
              <ul
                className="grid grid-cols-1 gap-2 text-white/70 mt-4"
                data-testid="footer-links"
              >
                <li>
                  <LocalizedClientLink
                    className="hover:text-white cursor-pointer"
                    href={`/`}
                    data-testid="category-link"
                  >
                    Home
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-white cursor-pointer"
                    href={`/bundles`}
                    data-testid="category-link"
                  >
                    Bundles
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-white cursor-pointer"
                    href={`/bundles/create`}
                    data-testid="category-link"
                  >
                    Build Bundle
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-white cursor-pointer"
                    href={`/subscription`}
                    data-testid="category-link"
                  >
                    Subscription
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-y-2">
              <span className="txt-large-plus txt-ui-fg-base">Support</span>
              <ul
                className="grid grid-cols-1 gap-2 text-white/70 mt-4"
                data-testid="footer-links"
              >
                <li>
                  <LocalizedClientLink
                    className="hover:text-white cursor-pointer"
                    href={`#`}
                    data-testid="category-link"
                  >
                    Help Center
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-white cursor-pointer"
                    href={`#`}
                    data-testid="category-link"
                  >
                    Contact Us
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-white cursor-pointer"
                    href={`#`}
                    data-testid="category-link"
                  >
                    Shipping Info
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="hover:text-white cursor-pointer"
                    href={`#`}
                    data-testid="category-link"
                  >
                    Returns
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>

            <div>
              <span className="txt-large-plus">Connect With Us</span>
              <ul className="flex flex-wrap gap-4 mt-4">
                <li>
                  <LocalizedClientLink
                    className="cursor-pointer"
                    href={`/`}
                    data-testid="category-link"
                  >
                    <Image
                      src="/facebook.svg"
                      alt="Facebook"
                      className="hover:opacity-70"
                      width={32}
                      height={32}
                    />
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="cursor-pointer"
                    href={`/`}
                    data-testid="category-link"
                  >
                    <Image
                      src="/twitter.svg"
                      alt="Twitter"
                      className="hover:opacity-70"
                      width={32}
                      height={32}
                    />
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    className="cursor-pointer"
                    href={`/`}
                    data-testid="category-link"
                  >
                    <Image
                      src="/insta.svg"
                      alt="Instagram"
                      className="hover:opacity-70"
                      width={32}
                      height={32}
                    />
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="w-full my-10 text-center">
          <Text className="text-sm">
            © 2026 Elvar Food Stuff Trading. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  )
}
