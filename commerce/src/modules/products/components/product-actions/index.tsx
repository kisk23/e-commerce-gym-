"use client"

import { addCustomBundleToCart } from "@lib/data/bundles"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import BundleSummary from "@modules/bundle/components/bundle-summary"
import { useBundleContext } from "@modules/bundle/store/bundle-context"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const WEIGHT_STEP_G = 100
const DEFAULT_WEIGHT_G = 1000
const MIN_BUNDLE_WEIGHT_G = 1000
const MIN_BUNDLE_UNITS = Math.round(MIN_BUNDLE_WEIGHT_G / WEIGHT_STEP_G)

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { items, addItem, clearItems } = useBundleContext()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAddingBundle, setIsAddingBundle] = useState(false)
  const [isSubmittingBundle, setIsSubmittingBundle] = useState(false)
  const [bundleMessage, setBundleMessage] = useState<string | null>(null)
  const [weightG, setWeightG] = useState(DEFAULT_WEIGHT_G)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant, pathname, router, searchParams])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")
  const bundleQuantityG = Math.max(MIN_BUNDLE_WEIGHT_G, weightG)
  const categoryName = product.categories?.[0]?.name || product.type?.value
  const canUseSelectedVariant =
    !!selectedVariant && !!isValidVariant && !!inStock && !disabled

  const onWeightChange = (value: string) => {
    const parsed = Number(value)

    if (!Number.isFinite(parsed)) {
      setWeightG(DEFAULT_WEIGHT_G)
      return
    }

    const roundedToStep = Math.round(parsed / WEIGHT_STEP_G) * WEIGHT_STEP_G
    setWeightG(Math.max(DEFAULT_WEIGHT_G, roundedToStep))
  }

  const handleAddToBundle = () => {
    if (!selectedVariant?.id || !canUseSelectedVariant) {
      return
    }

    setIsAddingBundle(true)
    addItem({
      product,
      variantId: selectedVariant.id,
      quantity: bundleQuantityG,
    })
    setBundleMessage(`${product.title} added to your bundle.`)
    window.setTimeout(() => setIsAddingBundle(false), 250)
  }

  const submitBundle = async () => {
    setIsSubmittingBundle(true)
    setBundleMessage(null)

    if (!items.length) {
      setIsSubmittingBundle(false)
      setBundleMessage("Please add at least one item to your bundle.")
      return
    }

    const sanitizedItems = items
      .filter((item) => !!item.variantId)
      .map((item) => ({
        variant_id: item.variantId,
        quantity: Math.max(
          MIN_BUNDLE_UNITS,
          Math.round(
            (Number(item.quantity) || MIN_BUNDLE_WEIGHT_G) / WEIGHT_STEP_G
          )
        ),
      }))

    if (!sanitizedItems.length) {
      setIsSubmittingBundle(false)
      setBundleMessage("Please choose at least one product variant.")
      return
    }

    try {
      await addCustomBundleToCart({
        countryCode,
        title: "My Custom Bundle",
        items: sanitizedItems,
      })
      setBundleMessage("Custom bundle added to cart.")
      clearItems()
    } catch (error) {
      setBundleMessage(
        error instanceof Error
          ? error.message
          : "Could not add custom bundle to cart."
      )
    } finally {
      setIsSubmittingBundle(false)
    }
  }

  return (
    <div className="flex flex-col gap-4" ref={actionsRef}>
      <section className="rounded-large border border-beige/70 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-secondary">
              {categoryName || "Product"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold leading-tight text-primary">
              {product.title}
            </h1>
          </div>
          <ProductPrice product={product} variant={selectedVariant} />
        </div>

        {product.description ? (
          <p className="mt-3 text-sm leading-6 text-gray-600">
            {product.description}
          </p>
        ) : null}

        <div className="mt-5">
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAddingBundle}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <label className="mt-4 flex flex-col gap-y-1 text-sm">
          <span className="font-medium text-primary">Amount (g)</span>
          <input
            type="number"
            min={DEFAULT_WEIGHT_G}
            step={WEIGHT_STEP_G}
            value={weightG}
            onChange={(event) => onWeightChange(event.target.value)}
            className="h-11 rounded-rounded border border-beige bg-white px-3 py-2 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            disabled={!!disabled || isAddingBundle}
          />
          <span className="text-xs text-gray-500">
            Minimum {MIN_BUNDLE_WEIGHT_G}g per bundle item.
          </span>
        </label>

        <div className="mt-5">
          <Button
            onClick={handleAddToBundle}
            disabled={!canUseSelectedVariant || isAddingBundle}
            variant="primary"
            className="h-11 w-full rounded-rounded bg-primary text-white hover:bg-primary/90"
            isLoading={isAddingBundle}
            data-testid="add-bundle-button"
          >
            {!selectedVariant
              ? "Select variant"
              : !inStock || !isValidVariant
              ? "Out of stock"
              : "Add to bundle"}
          </Button>
        </div>

        {bundleMessage ? (
          <p className="mt-3 text-sm text-gray-600" role="status">
            {bundleMessage}
          </p>
        ) : null}
      </section>

      <BundleSummary
        title="My Custom Bundle"
        onTitleChange={() => null}
        onSubmit={submitBundle}
        isSubmitting={isSubmittingBundle}
        message={bundleMessage}
      />

      <MobileActions
        product={product}
        variant={selectedVariant}
        options={options}
        updateOptions={setOptionValue}
        inStock={inStock}
        handleAddToBundle={handleAddToBundle}
        isAddingBundle={isAddingBundle}
        show={!inView}
        optionsDisabled={!!disabled || isAddingBundle}
      />
    </div>
  )
}
