import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { BundleProvider } from "@modules/bundle/store/bundle-context"
import {
  getProductNutritionPer100g,
  getUnitPriceForVariant,
} from "@modules/bundle/utils/bundle-calculations"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const nutritionLabels = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
] as const

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const nutrition = getProductNutritionPer100g(product)
  const categoryName = product.categories?.[0]?.name || product.type?.value
  const maxNutritionValue = Math.max(
    1,
    ...nutritionLabels.map((item) => Number(nutrition[item.key]) || 0)
  )
  const unitPrice = getUnitPriceForVariant(product)

  return (
    <BundleProvider>
      <main className="bg-white">
        <section className="content-container py-6 small:py-10">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 text-xs font-medium text-[#717182]"
          >
            Home / Product Details
          </nav>

          <div className="grid grid-cols-1 gap-6 small:grid-cols-[minmax(0,1fr)_390px] small:items-start">
            <div className="min-w-0 opacity-0 animate-[fade-in-up_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: "0ms" }}>
              <ImageGallery images={images} title={product.title} />

              <section className="mt-8 rounded-3xl border border-[#E6E6E6] bg-white p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] opacity-0 animate-[fade-in-up_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: "200ms" }}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl md:text-2xl font-bold text-[#0A0A0A]">
                      Nutrition Facts
                    </h2>
                    <p className="text-sm font-medium text-[#717182]">
                      {product.title} 100g Nutrition Breakdown
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E6E6E6] rounded-xl text-sm font-medium text-[#0A0A0A] shrink-0">
                    Per 100g
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {nutritionLabels.map((item) => {
                    const value = Math.round(Number(nutrition[item.key]) || 0)
                    const percentage = Math.min(
                      100,
                      Math.max(2, (value / maxNutritionValue) * 100)
                    )

                    return (
                      <div key={item.key} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-sm">
                          <dt className="font-semibold text-[#0A0A0A]">
                            {item.label}
                          </dt>
                          <dd className="font-medium text-[#717182]">
                            {value} <span className="text-[#0A0A0A] ml-0.5">{item.unit}</span>
                          </dd>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F5F5F5]">
                          <div
                            className="h-full rounded-full bg-[#1A330B] origin-left animate-scale-x-in"
                            style={{ width: `${percentage}%`, animationDelay: `${400 + (nutritionLabels.indexOf(item) * 100)}ms` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </dl>

                <div className="mt-10 pt-8 border-t border-[#E6E6E6] grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="text-[#0A0A0A]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><path d="M8 12H16"/><path d="M12 8V16"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#0A0A0A]">Fresh source</p>
                      <p className="mt-1 text-xs text-[#717182] leading-5">Picked for balanced meals.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="text-[#0A0A0A]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8V16C21 18.7614 18.7614 21 16 21H8C5.23858 21 3 18.7614 3 16V8C3 5.23858 5.23858 3 8 3H16C18.7614 3 21 5.23858 21 8Z"/><path d="M7 12H17"/><path d="M12 7V17"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#0A0A0A]">Bundle ready</p>
                      <p className="mt-1 text-xs text-[#717182] leading-5">Add this item to an active bundle.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="text-[#0A0A0A]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8V12L14 14"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#0A0A0A]">Unit price</p>
                      <p className="mt-1 text-xs text-[#717182] leading-5">{unitPrice ? `${unitPrice} / kg` : "-"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="text-[#0A0A0A]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#0A0A0A]">Storage</p>
                      <p className="mt-1 text-xs text-[#717182] leading-5">Keep in a cool, dry place.</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="small:sticky small:top-24 opacity-0 animate-[fade-in-up_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards]" style={{ animationDelay: "100ms" }}>
              <ProductOnboardingCta />
              <Suspense
                fallback={
                  <ProductActions
                    disabled={true}
                    product={product}
                    region={region}
                  />
                }
              >
                <ProductActionsWrapper id={product.id} region={region} />
              </Suspense>
            </aside>
          </div>
        </section>

        <section
          className="content-container pb-12 pt-4 small:pb-20 opacity-0 animate-[fade-in-up_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards]"
          style={{ animationDelay: "300ms" }}
          data-testid="related-products-container"
        >
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </section>
      </main>
    </BundleProvider>
  )
}

export default ProductTemplate
