export const e2eEnv = {
  backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  storefrontUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  countryCode:
    process.env.E2E_COUNTRY_CODE ||
    process.env.NEXT_PUBLIC_DEFAULT_REGION ||
    "ae",
  bundleId: process.env.E2E_BUNDLE_ID || "",
  stripeApiKey: process.env.STRIPE_API_KEY || "",
  expectPagination: process.env.E2E_EXPECT_PAGINATION === "true",
}

export function missingEnv(keys: Array<keyof typeof e2eEnv>) {
  return keys.filter((key) => !e2eEnv[key])
}
