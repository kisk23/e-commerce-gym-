import { Metadata } from "next"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import CustomBundleBuilder from "@modules/bundle/components/custom-bundle-builder"
import { BundleProductFilters, BundleProductSort } from "@modules/bundle/types"

export const metadata: Metadata = {
  title: "Custom Bundle Builder",
  description:
    "Create your own bundle from products and add it to cart in one click.",
}

const PRODUCT_LIMIT = 12

type SearchParams = {
  page?: string | string[]
  q?: string | string[]
  category_id?: string | string[]
  collection_id?: string | string[]
  tag_id?: string | string[]
  type_id?: string | string[]
  sortBy?: string | string[]
}

const getSearchParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] || "" : value || ""

const parsePage = (value?: string | string[]) => {
  const parsed = Number.parseInt(getSearchParam(value), 10)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const sortOrders: Record<BundleProductSort, string> = {
  created_at: "-created_at",
  oldest: "created_at",
  title_asc: "title",
  title_desc: "-title",
}

const parseSort = (value?: string | string[]): BundleProductSort => {
  const sortBy = getSearchParam(value)

  return Object.keys(sortOrders).includes(sortBy)
    ? (sortBy as BundleProductSort)
    : "created_at"
}

export default async function CustomBundlePage(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<SearchParams>
}) {
  const params = await props.params
  const searchParams = await props.searchParams

  const page = parsePage(searchParams.page)
  const filters: BundleProductFilters = {
    q: getSearchParam(searchParams.q).trim(),
    categoryId: getSearchParam(searchParams.category_id),
    collectionId: getSearchParam(searchParams.collection_id),
    tagId: getSearchParam(searchParams.tag_id),
    typeId: getSearchParam(searchParams.type_id),
    sortBy: parseSort(searchParams.sortBy),
  }

  const queryParams: HttpTypes.FindParams & HttpTypes.StoreProductListParams = {
    limit: PRODUCT_LIMIT,
    order: sortOrders[filters.sortBy],
    is_giftcard: false,
    fields:
      "id,title,handle,thumbnail,collection_id,type_id,+metadata,+tags,*categories.id,*categories.name,*variants.id,*variants.title,*variants.calculated_price",
  }

  if (filters.q) {
    queryParams.q = filters.q
  }

  if (filters.categoryId) {
    queryParams.category_id = filters.categoryId
  }

  if (filters.collectionId) {
    queryParams.collection_id = filters.collectionId
  }

  if (filters.tagId) {
    queryParams.tag_id = filters.tagId
  }

  if (filters.typeId) {
    queryParams.type_id = filters.typeId
  }

  const [productResult, categories, collectionsResult] = await Promise.all([
    listProducts({
      countryCode: params.countryCode,
      pageParam: page,
      queryParams,
    }).catch(() => ({
      response: { products: [], count: 0 },
      nextPage: null,
    })),
    listCategories({
      fields: "id,name,handle",
      limit: 100,
    }).catch(() => []),
    listCollections({
      fields: "id,title,handle",
      limit: "100",
    }).catch(() => ({ collections: [], count: 0 })),
  ])

  const hasCalculatedAmount = (variant: {
    calculated_price?: { calculated_amount?: number | string | null } | null
  }) => {
    const amount = variant.calculated_price?.calculated_amount

    if (typeof amount === "number") {
      return Number.isFinite(amount)
    }

    if (typeof amount === "string") {
      const parsed = Number(amount)
      return Number.isFinite(parsed)
    }

    return false
  }

  const bundleProducts = (productResult.response.products || [])
    .map((product) => ({
      ...product,
      title: product.title || "Untitled product",
      variants: (product.variants || []).filter((variant) =>
        hasCalculatedAmount(variant)
      ),
    }))
    .filter((product) => product.variants.length > 0)

  return (
    <CustomBundleBuilder
      countryCode={params.countryCode}
      products={bundleProducts}
      categories={categories.map((category) => ({
        id: category.id,
        label: category.name,
      }))}
      collections={collectionsResult.collections.map((collection) => ({
        id: collection.id,
        label: collection.title,
      }))}
      filters={filters}
      pagination={{
        page,
        limit: PRODUCT_LIMIT,
        count: productResult.response.count,
        nextPage: productResult.nextPage,
      }}
    />
  )
}
