export type StoreBundleItem = {
  id: string
  product_id: string
  product_title: string
  variant_id: string
  variant_title: string
  quantity: number
  weight?: number
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  thumbnail?: string | null
}

export type StoreBundle = {
  id: string
  title: string
  description: string | null
  thumbnail?: string | null
  bundle_type?: string | null
  discount_percentage: number
  is_active: boolean
  total_weight?: number
  total_calories?: number
  total_protein?: number
  total_carbs?: number
  total_fat?: number
  total_price?: number
  currency_code?: string | null
  items: StoreBundleItem[]
}
