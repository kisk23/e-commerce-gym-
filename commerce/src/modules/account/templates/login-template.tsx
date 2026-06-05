"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export const LOGIN_VIEW = {
  SIGN_IN: "sign-in",
  REGISTER: "register",
} as const

export type LOGIN_VIEW = typeof LOGIN_VIEW[keyof typeof LOGIN_VIEW]

const LoginTemplate = ({ redirectTo }: { redirectTo?: string }) => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="w-full flex justify-start px-8 py-8">
      {currentView === "sign-in" ? (
        <Login setCurrentView={setCurrentView} redirectTo={redirectTo} />
      ) : (
        <Register setCurrentView={setCurrentView} redirectTo={redirectTo} />
      )}
    </div>
  )
}

export default LoginTemplate
