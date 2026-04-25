import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "../styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
  <html lang="en">
   <body className="bg-grey-0 text-grey-90 antialiased">
    <main className="relative min-h-screen">
      {props.children}
    </main>
  </body>
</html>
  )
}
