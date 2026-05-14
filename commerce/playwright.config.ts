import { defineConfig, devices } from "@playwright/test"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

for (const envFile of [".env.local", ".env.e2e"]) {
  const path = resolve(__dirname, envFile)

  if (!existsSync(path)) {
    continue
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) {
      continue
    }

    const separatorIndex = trimmed.indexOf("=")

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "")

    process.env[key] ??= value
  }
}

const storefrontUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: storefrontUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      cwd: "../medusa-server",
      url: `${backendUrl}/health`,
      timeout: 120_000,
      reuseExistingServer: true,
    },
    {
      command: "yarn dev",
      url: `${storefrontUrl}/favicon.ico`,
      timeout: 120_000,
      reuseExistingServer: true,
    },
  ],
})
