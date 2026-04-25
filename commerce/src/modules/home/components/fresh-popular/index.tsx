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
      fields: "*variants.calculated_price,+metadata",
    },
  })

  if (!pricedProducts || pricedProducts.length === 0) {
    return null
  }

  return (
    <section className="w-full py-16 bg-gradient-to-br from-beige/20 to-beige/10">
      
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-10">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-black">
            Fresh & Popular
          </h2>
          <p className="text-gray-500 text-base md:text-lg max-w-md">
            Top-quality vegetables and fruits loved by our community
          </p>
        </div>

        {/* Products */}
        <div className="w-full flex gap-6 overflow-x-auto no-scrollbar justify-start md:justify-center">

          {pricedProducts.slice(0, 4).map((product) => (
            <div key={product.id} className="flex-shrink-0">
              <ProductPreview product={product} region={region} />
            </div>
          ))}

        </div>

      </div>
    </section>
  )
}