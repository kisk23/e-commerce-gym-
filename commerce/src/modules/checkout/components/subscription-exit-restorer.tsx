"use client"

import { useEffect, useMemo, useRef } from "react"
import { useParams, usePathname } from "next/navigation"

import { readCartSnapshot } from "@lib/cart-snapshot"
import { restoreCartFromSnapshot } from "@lib/cart-restore-client"

const isSubscriptionCheckoutPath = (pathname: string) =>
  pathname.includes("/subscription-checkout")

export default function SubscriptionExitRestorer() {
  const pathname = usePathname()
  const params = useParams<{ countryCode?: string | string[] }>()
  const countryCode = useMemo(() => {
    return typeof params.countryCode === "string" ? params.countryCode : "us"
  }, [params.countryCode])

  const restoringRef = useRef(false)
  const wasInSubscriptionCheckoutRef = useRef(isSubscriptionCheckoutPath(pathname))

  const restoreNow = async () => {
    const snapshot = readCartSnapshot()
    if (!snapshot) return
    if (restoringRef.current) return

    restoringRef.current = true
    try {
      await restoreCartFromSnapshot(countryCode)
    } catch {
      // keep snapshot for retry
    } finally {
      restoringRef.current = false
    }
  }

  useEffect(() => {
    const inSubscriptionCheckout = isSubscriptionCheckoutPath(pathname)
    const wasInSubscriptionCheckout = wasInSubscriptionCheckoutRef.current
    wasInSubscriptionCheckoutRef.current = inSubscriptionCheckout

    if (wasInSubscriptionCheckout && !inSubscriptionCheckout) {
      void restoreNow()
    }
  }, [pathname])

  useEffect(() => {
    // Also handle full page unload while in subscription checkout.
    const handler = () => {
      const snapshot = readCartSnapshot()
      if (!snapshot) return
      // Can't reliably run async here; we only ensure snapshot persists.
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  return null
}

