import { HttpTypes } from "@medusajs/types"
import { listProducts } from "@lib/data/products"
import ProductPreview from "@modules/products/components/product-preview"

export default async function FreshPopular({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection | null
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection?.id,
      fields: "*variants.calculated_price,+metadata,*categories",
    },
  })

  if (!pricedProducts || pricedProducts.length === 0) {
    return null
  }

  return (
    <section className="py-10 sm:py-12 bg-gradient-to-br from-beige/20 to-beige/10">
      {/* Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-8">
        {/* HEADER (you removed this — needed for balance) */}
        <div className="text-center max-w-md flex flex-col gap-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-black">
            Fresh & Popular
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-gray-500">
            Top-quality vegetables and fruits loved by our community
          </p>
        </div>

        {/* MOBILE: horizontal scroll */}
        <div className="w-full flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory md:hidden pb-2">
          {pricedProducts.slice(0, 4).map((product) => (
            <div
              key={product.id}
              className="min-w-[78%] sm:min-w-[48%] snap-start"
            >
              <ProductPreview product={product} region={region} />
            </div>
          ))}
        </div>

        {/* DESKTOP: grid */}
        <div className="hidden md:grid w-full grid-cols-2 lg:grid-cols-4 gap-6">
          {pricedProducts.slice(0, 4).map((product) => (
            <ProductPreview
              key={product.id}
              product={product}
              region={region}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
