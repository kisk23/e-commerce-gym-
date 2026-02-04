export type ShoppingGoal = "bulk" | "cut"

export type Vegetable = {
  id: string
  name: string
  pricePer100g: number
  currencyCode: string
  caloriesPer100g: number
  defaultWeightG: number
}

export type BundleItem = {
  vegetableId: string
  weightG: number
}

export type Bundle = {
  id: string
  name: string
  description: string
  goal: ShoppingGoal
  discountPercent: number
  items: BundleItem[]
}

export type SubscriptionPlan = {
  id: string
  months: 3 | 6 | 9
  discountPercent: number
  label: string
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "sub-3",
    months: 3,
    discountPercent: 3,
    label: "3 Months",
  },
  {
    id: "sub-6",
    months: 6,
    discountPercent: 7,
    label: "6 Months",
  },
  {
    id: "sub-9",
    months: 9,
    discountPercent: 12,
    label: "9 Months",
  },
]
