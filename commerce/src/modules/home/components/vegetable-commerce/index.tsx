"use client"

import { useMemo, useState } from "react"
import { Button, Heading, Text } from "@medusajs/ui"

import {
  Bundle,
  BundleItem,
  ShoppingGoal,
  SubscriptionPlan,
  Vegetable,
  subscriptionPlans,
} from "@modules/home/data/vegetable-commerce"

type BundleSummary = {
  totalWeightG: number
  totalCalories: number
  basePrice: number
  discountedPrice: number
}

type VegetableCommerceProps = {
  vegetables: Vegetable[]
  bundles: Bundle[]
}

const formatMoney = (amount: number, currencyCode: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount)

const toWeightMap = (vegetables: Vegetable[]) =>
  vegetables.reduce<Record<string, number>>((accumulator, vegetable) => {
    accumulator[vegetable.id] = vegetable.defaultWeightG
    return accumulator
  }, {})

const calculateBundleSummary = (
  items: BundleItem[],
  vegetables: Vegetable[],
  discountPercent: number,
  extraDiscountPercent: number
): BundleSummary => {
  const totals = items.reduce(
    (accumulator, item) => {
      const vegetable = vegetables.find(
        (currentVegetable) => currentVegetable.id === item.vegetableId
      )

      if (!vegetable) {
        return accumulator
      }

      const itemWeight = item.weightG
      const itemCalories = (vegetable.caloriesPer100g * itemWeight) / 100
      const itemPrice = (vegetable.pricePer100g * itemWeight) / 100

      return {
        totalWeightG: accumulator.totalWeightG + itemWeight,
        totalCalories: accumulator.totalCalories + itemCalories,
        basePrice: accumulator.basePrice + itemPrice,
      }
    },
    { totalWeightG: 0, totalCalories: 0, basePrice: 0 }
  )

  const priceAfterBundleDiscount =
    totals.basePrice * (1 - discountPercent / 100)
  const discountedPrice =
    priceAfterBundleDiscount * (1 - extraDiscountPercent / 100)

  return { ...totals, discountedPrice }
}

const goalLabel = (goal: ShoppingGoal) => (goal === "bulk" ? "Bulk" : "Cut")

const VegetableCommerce = ({ vegetables, bundles }: VegetableCommerceProps) => {
  const [goal, setGoal] = useState<ShoppingGoal>("bulk")
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlan["id"]>(
    subscriptionPlans[0].id
  )
  const [customWeights, setCustomWeights] = useState<Record<string, number>>(
    () => toWeightMap(vegetables)
  )

  const selectedPlan =
    subscriptionPlans.find((plan) => plan.id === selectedPlanId) ??
    subscriptionPlans[0]

  const recommendedBundles = useMemo(
    () =>
      bundles
        .filter((bundle) => bundle.goal === goal)
        .sort(
          (leftBundle, rightBundle) =>
            rightBundle.discountPercent - leftBundle.discountPercent
        ),
    [bundles, goal]
  )

  const customItems = useMemo(
    () =>
      vegetables
        .map((vegetable) => ({
          vegetableId: vegetable.id,
          weightG: customWeights[vegetable.id] || 0,
        }))
        .filter((item) => item.weightG > 0),
    [customWeights, vegetables]
  )

  const customSummary = useMemo(
    () => calculateBundleSummary(customItems, vegetables, 0, selectedPlan.discountPercent),
    [customItems, vegetables, selectedPlan.discountPercent]
  )

  const currencyCode = vegetables[0]?.currencyCode || "usd"

  const onWeightChange = (vegetableId: string, value: string) => {
    const parsed = Number(value)
    const safeValue = Number.isFinite(parsed) && parsed > 0 ? parsed : 0

    setCustomWeights((previousWeights) => ({
      ...previousWeights,
      [vegetableId]: Math.round(safeValue),
    }))
  }

  return (
    <div className="bg-ui-bg-base">
      <div className="content-container py-10 small:py-14 flex flex-col gap-10">
        <div className="rounded-2xl border border-ui-border-base p-6 small:p-10 bg-ui-bg-subtle flex flex-col gap-5">
          <Text className="txt-small-plus text-ui-fg-subtle uppercase">
            Vegetable Store
          </Text>
          <Heading level="h1" className="text-3xl leading-10 text-ui-fg-base">
            Shop by Goal, Build by Calories
          </Heading>
          <Text className="text-ui-fg-subtle max-w-3xl">
            Bundle creation is now handled in the Admin panel. The storefront
            only shows live vegetable products and recommendations.
          </Text>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={goal === "bulk" ? "primary" : "secondary"}
              onClick={() => setGoal("bulk")}
            >
              Goal: Bulk
            </Button>
            <Button
              variant={goal === "cut" ? "primary" : "secondary"}
              onClick={() => setGoal("cut")}
            >
              Goal: Cut
            </Button>
          </div>
        </div>

        <section className="rounded-2xl border border-ui-border-base p-6 small:p-8 flex flex-col gap-4">
          <Heading level="h2" className="text-2xl">
            Subscription Plans
          </Heading>
          <Text className="text-ui-fg-subtle">
            Choose a plan to apply extra savings on checkout.
          </Text>
          <div className="grid grid-cols-1 small:grid-cols-3 gap-3">
            {subscriptionPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  selectedPlan.id === plan.id
                    ? "border-ui-fg-base bg-ui-bg-subtle"
                    : "border-ui-border-base"
                }`}
              >
                <Text className="txt-medium-plus">{plan.label}</Text>
                <Text className="text-ui-fg-subtle">
                  Extra {plan.discountPercent}% off bundles
                </Text>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-ui-border-base p-6 small:p-8 flex flex-col gap-6">
          <Heading level="h2" className="text-2xl">
            Create Your Bundle
          </Heading>
          <Text className="text-ui-fg-subtle">
            Build custom bundles using live data from the product catalog.
          </Text>
          <div className="grid grid-cols-1 small:grid-cols-2 gap-4">
            {vegetables.map((vegetable) => (
              <label
                key={vegetable.id}
                className="rounded-xl border border-ui-border-base p-4 flex flex-col gap-2"
              >
                <Text className="txt-medium-plus">{vegetable.name}</Text>
                <Text className="text-ui-fg-subtle">
                  {vegetable.caloriesPer100g} cal / 100g |{" "}
                  {formatMoney(vegetable.pricePer100g, vegetable.currencyCode)} /
                  100g
                </Text>
                <input
                  min={0}
                  step={10}
                  type="number"
                  value={customWeights[vegetable.id] ?? 0}
                  onChange={(event) =>
                    onWeightChange(vegetable.id, event.target.value)
                  }
                  className="w-full rounded-md border border-ui-border-base px-3 py-2"
                />
              </label>
            ))}
          </div>
          <div className="rounded-xl border border-ui-border-base p-4 flex flex-col gap-2">
            <Text className="txt-medium-plus">Custom Bundle Summary</Text>
            <Text className="text-ui-fg-subtle">
              Total Weight: {customSummary.totalWeightG}g
            </Text>
            <Text className="text-ui-fg-subtle">
              Total Calories: {Math.round(customSummary.totalCalories)} kcal
            </Text>
            <Text className="text-ui-fg-subtle">
              Base Price: {formatMoney(customSummary.basePrice, currencyCode)}
            </Text>
            <Text className="text-ui-fg-subtle">
              With {selectedPlan.label} Plan:{" "}
              {formatMoney(customSummary.discountedPrice, currencyCode)}
            </Text>
            <div className="pt-2">
              <Button
                variant="secondary"
                onClick={() => setCustomWeights(toWeightMap(vegetables))}
              >
                Reset Weights
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-ui-border-base p-6 small:p-8 flex flex-col gap-6">
          <Heading level="h2" className="text-2xl">
            Recommended Admin Bundles ({goalLabel(goal)})
          </Heading>
          <Text className="text-ui-fg-subtle">
            Bundle discounts stack with your subscription plan.
          </Text>
          <div className="grid grid-cols-1 medium:grid-cols-2 gap-4">
            {recommendedBundles.map((bundle) => {
              const summary = calculateBundleSummary(
                bundle.items,
                vegetables,
                bundle.discountPercent,
                selectedPlan.discountPercent
              )

              return (
                <article
                  key={bundle.id}
                  className="rounded-xl border border-ui-border-base p-4 flex flex-col gap-2"
                >
                  <Text className="txt-medium-plus">{bundle.name}</Text>
                  <Text className="text-ui-fg-subtle">{bundle.description}</Text>
                  <Text className="text-ui-fg-subtle">
                    Discount: {bundle.discountPercent}% + Plan{" "}
                    {selectedPlan.discountPercent}%
                  </Text>
                  <Text className="text-ui-fg-subtle">
                    {Math.round(summary.totalCalories)} kcal |{" "}
                    {summary.totalWeightG}g
                  </Text>
                  <Text className="text-ui-fg-subtle">
                    {formatMoney(summary.basePrice, currencyCode)} -&gt;{" "}
                    {formatMoney(summary.discountedPrice, currencyCode)}
                  </Text>
                </article>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-ui-border-base p-6 small:p-8">
          <Heading level="h2" className="text-2xl mb-4">
            Vegetable Nutrition Catalog
          </Heading>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-2 border-b border-ui-border-base">Vegetable</th>
                  <th className="py-2 border-b border-ui-border-base">
                    Calories / 100g
                  </th>
                  <th className="py-2 border-b border-ui-border-base">
                    Typical Weight
                  </th>
                  <th className="py-2 border-b border-ui-border-base">
                    Price / 100g
                  </th>
                </tr>
              </thead>
              <tbody>
                {vegetables.map((vegetable) => (
                  <tr key={`row-${vegetable.id}`}>
                    <td className="py-2 border-b border-ui-border-base">
                      {vegetable.name}
                    </td>
                    <td className="py-2 border-b border-ui-border-base">
                      {vegetable.caloriesPer100g}
                    </td>
                    <td className="py-2 border-b border-ui-border-base">
                      {vegetable.defaultWeightG}g
                    </td>
                    <td className="py-2 border-b border-ui-border-base">
                      {formatMoney(vegetable.pricePer100g, vegetable.currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default VegetableCommerce
