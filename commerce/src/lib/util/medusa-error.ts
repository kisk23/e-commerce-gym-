export default function medusaError(error: any): never {
  const toReadableMessage = (message: string) => {
    const trimmed = message.trim()

    if (!trimmed) {
      return "Request failed."
    }

    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
  }

  const extractMessage = (data: unknown, status?: number) => {
    if (typeof data === "string" && data.trim()) {
      return data
    }

    if (data && typeof data === "object") {
      const payload = data as { message?: unknown; error?: unknown }

      if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message
      }

      if (typeof payload.error === "string" && payload.error.trim()) {
        return payload.error
      }
    }

    if (typeof status === "number") {
      return `request failed with status ${status}`
    }

    return "request failed"
  }

  if (error.response) {
    const u = new URL(error.config.url, error.config.baseURL)
    console.error("Resource:", u.toString())
    console.error("Response data:", error.response.data)
    console.error("Status code:", error.response.status)
    console.error("Headers:", error.response.headers)

    throw new Error(
      toReadableMessage(
        extractMessage(error.response.data, error.response.status)
      )
    )
  } else if (error.request) {
    throw new Error(toReadableMessage("no response received from server"))
  } else {
    const message =
      error instanceof Error ? error.message : "error setting up request"
    throw new Error(toReadableMessage(message))
  }
}
