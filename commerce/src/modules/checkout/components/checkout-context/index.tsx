"use client"

import React, { createContext, useContext, useState } from "react"

type CheckoutContextType = {
  errors: string[]
  setErrors: (e: string[]) => void
  clearErrors: () => void
}

const CheckoutContext = createContext<CheckoutContextType>({
  errors: [],
  setErrors: () => {},
  clearErrors: () => {},
})

export const useCheckout = () => useContext(CheckoutContext)

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<string[]>([])

  return (
    <CheckoutContext.Provider
      value={{ errors, setErrors, clearErrors: () => setErrors([]) }}
    >
      {children}
    </CheckoutContext.Provider>
  )
}
