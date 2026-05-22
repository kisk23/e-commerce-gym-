"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,

  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"
import { syncSubscriptionDiscount } from "./cart"

export type EmailVerificationStatus = "verified" | "not_yet"

export type SignupState =
  | {
      type: "success" | "error"
      message: string
    }
  | null

const getErrorMessage = (error: any) => error?.message || error.toString()

export const retrieveEmailVerificationStatus = async (): Promise<EmailVerificationStatus> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!Object.keys(headers).length) {
    return "not_yet"
  }

  return sdk.client
    .fetch<{ status: EmailVerificationStatus }>(
      `/store/email-verification/status`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )
    .then(({ status }) => status)
    .catch(() => "not_yet")
}

export const resendVerificationEmail = async () => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client.fetch<{ status: EmailVerificationStatus }>(
    `/store/email-verification/resend`,
    {
      method: "POST",
      headers,
      cache: "no-store",
    }
  )
}

export const confirmEmailVerification = async (token: string) => {
  return sdk.client
    .fetch<{ status: EmailVerificationStatus }>(
      `/store/email-verification/confirm`,
      {
        method: "POST",
        body: { token },
        cache: "no-store",
      }
    )
    .then(() => ({
      success: true,
      message: "Your email is verified. You can sign in now.",
    }))
    .catch((error) => ({
      success: false,
      message:
        error?.message ||
        "This verification link is invalid or expired. Please request a new one.",
    }))
}

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) {
      return null
    }

    const headers = {
      ...authHeaders,
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders",
        },
        headers,

        cache: "no-store",
      })
      .then(async ({ customer }) => {
        const status = await retrieveEmailVerificationStatus()

        return status === "verified" ? customer : null
      })
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export async function signup(
  _currentState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: formData.get("phone") as string,
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    await setAuthToken(token as string)

    const headers = {
      ...(await getAuthHeaders()),
    }

    await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    await removeAuthToken()

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    return {
      type: "success",
      message:
        "Account created. Check your email and verify it before signing in.",
    }
  } catch (error: any) {
    await removeAuthToken().catch(() => {})

    return {
      type: "error",
      message: getErrorMessage(error),
    }
  }
}

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const rawRedirect = formData.get("redirect")?.toString()
  const redirectTo =
    rawRedirect && rawRedirect.startsWith("/") ? rawRedirect : "/"

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        await setAuthToken(token as string)
        const status = await retrieveEmailVerificationStatus()

        if (status !== "verified") {
          await resendVerificationEmail().catch(() => null)
          await removeAuthToken()
          const customerCacheTag = await getCacheTag("customers")
          revalidateTag(customerCacheTag)
          throw new Error(
            "Please verify your email before signing in. We sent a verification email if one was not sent recently."
          )
        }

        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag)
      })
  } catch (error: any) {
    return getErrorMessage(error)
  }

  try {
    await transferCart()
  } catch (error: any) {
    return getErrorMessage(error)
  }

  redirect(redirectTo + "?step=address")
}

export async function signout(countryCode: string) {
  await sdk.auth.logout()

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)
  await syncSubscriptionDiscount(cartId)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({  }) => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}
