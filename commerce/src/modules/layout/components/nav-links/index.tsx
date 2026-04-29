"use client"
{
  /* component made for active navigation links */
}

import { useParams, usePathname } from "next/navigation"
import Link from "next/link"

const navItems = [
  { label: "Home", href: "/" },
  { label: "Bundles", href: "/bundles" },
  { label: "Build Bundle", href: "/bundles/create" },
  { label: "Subscription", href: "/subscription" },
]

export default function NavLinks() {
  const { countryCode } = useParams()
  const pathname = usePathname()

  const isActive = (href: string) => {
    const localizedHref = `/${countryCode}${href}`

    if (href === "/")
      return pathname === `/${countryCode}` || pathname === `/${countryCode}/`

    if (href === "/bundles") return pathname === localizedHref

    return pathname.startsWith(localizedHref)
  }

  return (
    <ul className="flex items-center gap-x-5 h-full text-lg">
      {navItems.map(({ label, href }) => (
        <li key={href}>
          <Link
            href={`/${countryCode}${href}`}
            className={`relative pb-1 transition-all duration-200 ${
              isActive(href)
                ? "text-primary font-semibold "
                : "text-ui-fg-subtle hover:text-primary/80"
            }`}
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
