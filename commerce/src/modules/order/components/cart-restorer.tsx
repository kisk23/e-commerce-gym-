"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"

import { readCartSnapshot } from "@lib/cart-snapshot"
import { restoreCartFromSnapshot } from "@lib/cart-restore-client"

type CartRestorerProps = {
  /**
   * If true, will run restore automatically on mount.
   * Keep this as true for order confirmed and cart pages.
   */
  restoreOnMount?: boolean
}

export default function CartRestorer({ restoreOnMount = true }: CartRestorerProps) {
  const params = useParams<{ countryCode?: string | string[] }>()
  const countryCode = useMemo(() => {
    return typeof params.countryCode === "string" ? params.countryCode : "us"
  }, [params.countryCode])

  const [hasTried, setHasTried] = useState(false)

  useEffect(() => {
    if (!restoreOnMount) return
    if (hasTried) return

    const snapshot = readCartSnapshot()
    if (!snapshot) {
      setHasTried(true)
      return
    }

    setHasTried(true)

    ;(async () => {
      try {
        await restoreCartFromSnapshot(countryCode)
      } catch {
        // Keep snapshot so refresh can retry.
      }
    })()
  }, [countryCode, hasTried, restoreOnMount])

  return null
}

