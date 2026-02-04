export type ShoppingGoal = "bulk" | "cut"

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

type CreateBundleInput = {
  name: string
  description: string
  goal: ShoppingGoal
  discountPercent: number
  items: BundleItem[]
}

const defaultBundles: Bundle[] = [
  {
    id: "bulk-starter-pack",
    name: "Bulk Starter Pack",
    description: "Higher-calorie vegetables to support muscle gain meals.",
    goal: "bulk",
    discountPercent: 12,
    items: [
      { vegetableId: "sweet-potato", weightG: 450 },
      { vegetableId: "potato", weightG: 400 },
      { vegetableId: "corn", weightG: 300 },
      { vegetableId: "carrot", weightG: 200 },
    ],
  },
  {
    id: "bulk-energy-pack",
    name: "Bulk Energy Pack",
    description: "Dense carb-focused vegetables for high-volume training days.",
    goal: "bulk",
    discountPercent: 15,
    items: [
      { vegetableId: "potato", weightG: 500 },
      { vegetableId: "corn", weightG: 350 },
      { vegetableId: "beetroot", weightG: 250 },
      { vegetableId: "sweet-potato", weightG: 300 },
    ],
  },
  {
    id: "cut-lean-pack",
    name: "Cut Lean Pack",
    description: "Low-calorie, high-volume vegetables to support fat loss meals.",
    goal: "cut",
    discountPercent: 10,
    items: [
      { vegetableId: "broccoli", weightG: 400 },
      { vegetableId: "spinach", weightG: 350 },
      { vegetableId: "zucchini", weightG: 350 },
      { vegetableId: "carrot", weightG: 200 },
    ],
  },
  {
    id: "cut-shred-pack",
    name: "Cut Shred Pack",
    description: "Volume-friendly vegetables that keep calories controlled.",
    goal: "cut",
    discountPercent: 14,
    items: [
      { vegetableId: "spinach", weightG: 450 },
      { vegetableId: "broccoli", weightG: 350 },
      { vegetableId: "zucchini", weightG: 300 },
      { vegetableId: "beetroot", weightG: 200 },
    ],
  },
]

const sanitizeDiscount = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(Math.round(value), 90))
}

let bundlesState = [...defaultBundles]

export const listBundles = (): Bundle[] => {
  return bundlesState
}

export const createBundle = (input: CreateBundleInput): Bundle => {
  const bundle: Bundle = {
    id: `${input.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    name: input.name.trim(),
    description: input.description.trim(),
    goal: input.goal,
    discountPercent: sanitizeDiscount(input.discountPercent),
    items: input.items.map((item) => ({
      vegetableId: item.vegetableId,
      weightG: Math.max(0, Math.round(item.weightG)),
    })),
  }

  bundlesState = [bundle, ...bundlesState]

  return bundle
}

export const vegetableCatalog = [
  { id: "sweet-potato", name: "Sweet Potato" },
  { id: "potato", name: "Potato" },
  { id: "corn", name: "Corn" },
  { id: "broccoli", name: "Broccoli" },
  { id: "spinach", name: "Spinach" },
  { id: "zucchini", name: "Zucchini" },
  { id: "carrot", name: "Carrot" },
  { id: "beetroot", name: "Beetroot" },
] as const
