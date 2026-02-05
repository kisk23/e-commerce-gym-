export type StoreBundleItem = {
  id: string
  product_id: string
  product_title: string
  variant_id: string
  variant_title: string
  quantity: number
  thumbnail?: string | null
}

export type StoreBundle = {
  id: string
  title: string
  description: string | null
  discount_percentage: number
  is_active: boolean
  items: StoreBundleItem[]
}
