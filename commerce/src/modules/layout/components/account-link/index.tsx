"use client"

import Link from "next/link"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"

type AccountLinkProps = {
  children: ReactNode
  className?: string
  onClick?: () => void
  [key: string]: any
}

const AccountLink = ({
  children,
  className,
  onClick,
  ...props
}: AccountLinkProps) => {
  const { countryCode } = useParams()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const countryPrefix = `/${countryCode}`
  const search = searchParams.toString()
  const currentPath = `${pathname}${search ? `?${search}` : ""}`
  const nonReturnPages = [
    `${countryPrefix}/account`,
    `${countryPrefix}/verify-email`,
    `${countryPrefix}/forgot-password`,
    `${countryPrefix}/reset-password`,
  ]
  const shouldIncludeRedirect = !nonReturnPages.some((path) =>
    pathname.startsWith(path)
  )
  const href = shouldIncludeRedirect
    ? `${countryPrefix}/account?redirect=${encodeURIComponent(currentPath)}`
    : `${countryPrefix}/account`

  return (
    <Link href={href} className={className} onClick={onClick} {...props}>
      {children}
    </Link>
  )
}

export default AccountLink
