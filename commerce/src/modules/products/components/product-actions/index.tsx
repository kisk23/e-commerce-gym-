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
    <div className="flex flex-col gap-6" ref={actionsRef}>
      <section className="rounded-3xl border border-[#E6E6E6] bg-white p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-6">
        {/* Title and Description */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-start gap-2">
            <span className="w-fit rounded-full bg-[#1A330B]/10 px-3 py-1 text-xs font-semibold text-[#1A330B] uppercase tracking-wider">
              {categoryName || "Product"}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0A0A0A] leading-tight">
              {product.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center text-[#F59E0B]">
               <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
               <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
               <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
               <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
               <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-200"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            </div>
            <span className="text-sm font-medium text-[#717182]">(128 reviews)</span>
          </div>

          {product.description ? (
            <p className="mt-2 text-sm leading-6 text-[#717182]">
              {product.description}
            </p>
          ) : null}
        </div>

        <div className="pb-6 border-b border-[#E6E6E6]">
          <div className="text-2xl md:text-[28px] font-bold text-[#0A0A0A]">
            <ProductPrice product={product} variant={selectedVariant} />
          </div>
        </div>

        {/* Options */}
        <div className="">
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4 mb-4">
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

        {/* Amount Selector */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm text-[#0A0A0A]">Quantity (g)</label>
          <div className="flex items-center w-full border border-[#E6E6E6] rounded-xl overflow-hidden h-12 focus-within:ring-2 focus-within:ring-[#1A330B]">
            <button
              type="button"
              className="w-12 h-full flex items-center justify-center text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onWeightChange(String(weightG - WEIGHT_STEP_G))}
              disabled={!!disabled || isAddingBundle || weightG <= MIN_BUNDLE_WEIGHT_G}
              aria-label="Decrease quantity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <input
              type="number"
              min={DEFAULT_WEIGHT_G}
              step={WEIGHT_STEP_G}
              value={weightG}
              onChange={(event) => onWeightChange(event.target.value)}
              className="flex-1 h-full bg-white text-center text-[#0A0A0A] font-semibold text-base outline-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
              disabled={!!disabled || isAddingBundle}
            />
            <button
              type="button"
              className="w-12 h-full flex items-center justify-center text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onWeightChange(String(weightG + WEIGHT_STEP_G))}
              disabled={!!disabled || isAddingBundle}
              aria-label="Increase quantity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
          <span className="text-xs font-medium text-[#717182] mt-1">
            Minimum {MIN_BUNDLE_WEIGHT_G}g per bundle item.
          </span>
        </div>

        {/* Add to Bundle Button */}
        <div className="mt-2">
          <Button
            onClick={handleAddToBundle}
            disabled={!canUseSelectedVariant || isAddingBundle}
            className="w-full h-12 rounded-xl bg-[#1A330B] hover:bg-[#2A431B] text-white font-semibold text-base transition-colors flex items-center justify-center gap-2"
            isLoading={isAddingBundle}
            data-testid="add-bundle-button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            {!selectedVariant
              ? "Select variant"
              : !inStock || !isValidVariant
              ? "Out of stock"
              : "Add to Bundle"}
          </Button>
        </div>

        {bundleMessage ? (
          <div className="bg-[#1A330B]/10 text-[#1A330B] text-sm font-medium px-4 py-3 rounded-xl flex items-start gap-2" role="status">
             <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            {bundleMessage}
          </div>
        ) : null}

        {/* Guarantee Block */}
        <div className="mt-2 p-4 bg-[#F8F9FA] rounded-2xl flex items-start gap-3 border border-[#E6E6E6]">
           <div className="w-8 h-8 rounded-full bg-[#1A330B]/10 flex items-center justify-center shrink-0">
             <svg className="w-4 h-4 text-[#1A330B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
           </div>
           <div>
             <p className="text-sm font-semibold text-[#0A0A0A]">100% Fresh Guarantee</p>
             <p className="text-xs text-[#717182] mt-0.5 leading-5">We deliver only the freshest produce to your door.</p>
           </div>
        </div>
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
