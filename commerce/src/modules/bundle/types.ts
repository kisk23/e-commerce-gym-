export type BundleProductSort =
  | "created_at"
  | "oldest"
  | "title_asc"
  | "title_desc"

export type BundleProductFilters = {
  q: string
  categoryId: string
  collectionId: string
  tagId: string
  typeId: string
  sortBy: BundleProductSort
}

export type BundleFilterOption = {
  id: string
  label: string
}

export type BundleProductPagination = {
  page: number
  limit: number
  count: number
  nextPage: number | null
}
