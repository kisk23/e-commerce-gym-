export type StoreSubscriptionPlan = {
  id: string
  title: string
  description: string | null
  duration_months: number
  discount_percentage: number
  rank: number
  is_active: boolean
}

export type StoreCustomerSubscription = {
  id: string
  customer_id: string
  status: string
  plan_title: string
  duration_months: number
  discount_percentage: number
  starts_at: string
  ends_at: string
  remaining_ms?: number
  remaining_days?: number
  remaining_hours?: number
  is_active?: boolean
}

