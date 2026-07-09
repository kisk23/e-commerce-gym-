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
      <main className="bg-[#f5efe7]">
        <section className="content-container py-5 small:py-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-4 text-xs font-medium text-primary/70"
          >
            Home / Product Details
          </nav>

          <div className="grid grid-cols-1 gap-6 small:grid-cols-[minmax(0,1fr)_390px] small:items-start">
            <div className="min-w-0">
              <ImageGallery images={images} title={product.title} />

              <section className="mt-5 rounded-large border border-beige/70 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase text-secondary">
                      Nutrition facts
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-primary">
                      {product.title} 100g Nutrition Breakdown
                    </h2>
                  </div>
                  {categoryName ? (
                    <span className="w-fit rounded-circle bg-beige/50 px-3 py-1 text-xs font-medium text-primary">
                      {categoryName}
                    </span>
                  ) : null}
                </div>

                <dl className="mt-5 grid gap-4">
                  {nutritionLabels.map((item) => {
                    const value = Math.round(Number(nutrition[item.key]) || 0)
                    const percentage = Math.min(
                      100,
                      Math.max(4, (value / maxNutritionValue) * 100)
                    )

                    return (
                      <div key={item.key}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <dt className="font-medium text-primary">
                            {item.label}
                          </dt>
                          <dd className="text-gray-500">
                            {value}
                            {item.unit}
                          </dd>
                        </div>
                        <div className="h-2 overflow-hidden rounded-circle bg-beige/50">
                          <div
                            className="h-full rounded-circle bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </dl>

                <div className="mt-5 grid gap-3 rounded-rounded bg-[#faf7f1] p-3 text-sm text-gray-600 sm:grid-cols-3">
                  <div>
                    <p className="font-semibold text-primary">Fresh source</p>
                    <p className="mt-1">Picked for balanced meals.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Bundle ready</p>
                    <p className="mt-1">Add this item to an active bundle.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Unit price</p>
                    <p className="mt-1">{unitPrice ? `${unitPrice}/100g` : "-"}</p>
                  </div>
                </div>
              </section>
            </div>

            <aside className="small:sticky small:top-24">
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
          className="content-container pb-12 pt-4 small:pb-20"
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
