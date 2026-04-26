"use client"

import { StoreBundle } from "@lib/types/bundle"
import { useState } from "react"
import { Button } from "@medusajs/ui"
import { convertToLocale } from "@lib/util/money"
import { addBundleToCart } from "@lib/data/bundles"
import {
  calculateBundleOriginalPrice,
  calculateBundleSavings,
} from "@modules/bundle/utils/bundle-calculations"

type BundleRecommenderProps = {
  bundles: StoreBundle[]
  countryCode: string
  currencyCode?: string
}

type FitnessGoal =
  | "bulk"
  | "cut"
  | "maintenance"
  | "performance"
  | "general"
  | null

const goalOptions = [
  {
    id: "bulk" as const,
    title: "Build Muscle (Bulk)",
    description: "Gain muscle mass with high-calorie, protein-rich meals",
    icon: "💪",
  },
  {
    id: "cut" as const,
    title: "Lose Fat (Cut)",
    description:
      "Reduce body fat while maintaining muscle with controlled calories",
    icon: "🔥",
  },
  {
    id: "maintenance" as const,
    title: "Maintain Weight",
    description: "Keep your current physique with balanced nutrition",
    icon: "⚖️",
  },
  {
    id: "performance" as const,
    title: "Athletic Performance",
    description: "Optimize energy and recovery for peak performance",
    icon: "🏃",
  },
  {
    id: "general" as const,
    title: "General Health",
    description: "Healthy, balanced meals for overall wellness",
    icon: "🥗",
  },
]

const BundleRecommender = ({
  bundles,
  countryCode,
  currencyCode,
}: BundleRecommenderProps) => {
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal>(null)
  const [isAddingId, setIsAddingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const onAddBundle = async (bundleId: string) => {
    setIsAddingId(bundleId)
    setMessage(null)

    try {
      await addBundleToCart({
        bundleId,
        countryCode,
      })
      setMessage("Bundle added to cart successfully!")
    } catch {
      setMessage("Could not add bundle to cart. Please try again.")
    } finally {
      setIsAddingId(null)
    }
  }

  const getRecommendedBundles = () => {
    if (!selectedGoal) return []

    // Filter bundles by goal
    const matchingBundles = bundles.filter(
      (bundle) =>
        bundle.bundle_type?.toLowerCase() === selectedGoal.toLowerCase()
    )

    // If no exact matches, return all bundles
    return matchingBundles.length > 0 ? matchingBundles : bundles
  }

  const resetSelection = () => {
    setSelectedGoal(null)
    setMessage(null)
  }

  // Goal Selection Screen
  if (!selectedGoal) {
    return (
      <section className="content-container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl-semi mb-3">What's Your Fitness Goal?</h1>
            <p className="text-ui-fg-subtle text-lg">
              Tell us what you're working towards, and we'll recommend the
              perfect bundles for you.
            </p>
          </div>

          <div className="grid grid-cols-1 medium:grid-cols-2 gap-4">
            {goalOptions.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className="group relative rounded-xl border-2 border-ui-border-base bg-white p-6 text-left hover:border-ui-fg-interactive hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {goal.icon}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-ui-fg-base mb-1 group-hover:text-ui-fg-interactive transition-colors">
                      {goal.title}
                    </h3>
                    <p className="text-sm text-ui-fg-subtle leading-relaxed">
                      {goal.description}
                    </p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-5 h-5 text-ui-fg-interactive"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-ui-fg-muted">
              Not sure? Choose "General Health" to see all available bundles.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Recommended Bundles Screen
  const recommendedBundles = getRecommendedBundles()
  const selectedGoalInfo = goalOptions.find((g) => g.id === selectedGoal)

  return (
    <section className="content-container py-8">
      <div className="mb-6">
        <button
          onClick={resetSelection}
          className="inline-flex items-center gap-2 text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-colors mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Change Goal
        </button>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{selectedGoalInfo?.icon}</span>
          <div>
            <h2 className="text-2xl-semi">
              Recommended for: {selectedGoalInfo?.title}
            </h2>
            <p className="text-ui-fg-subtle mt-1">
              {selectedGoalInfo?.description}
            </p>
          </div>
        </div>
      </div>

      {recommendedBundles.length === 0 ? (
        <div className="text-center py-12 bg-ui-bg-subtle rounded-lg">
          <p className="text-ui-fg-subtle mb-4">
            No bundles available for this goal yet.
          </p>
          <Button onClick={resetSelection} variant="secondary">
            Try Another Goal
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 medium:grid-cols-2 large:grid-cols-3 gap-6">
            {recommendedBundles.map((bundle) => {
              const originalPrice = calculateBundleOriginalPrice(bundle)
              const savings = calculateBundleSavings(bundle)
              const hasDiscount = bundle.discount_percentage > 0

              return (
                <article
                  key={bundle.id}
                  className="rounded-lg border border-ui-border-base bg-white flex flex-col shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header Section */}
                  <div className="p-4 border-b border-ui-border-base">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-ui-fg-base flex-1">
                        {bundle.title}
                      </h3>
                      {hasDiscount && (
                        <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800 whitespace-nowrap">
                          {bundle.discount_percentage}% OFF
                        </span>
                      )}
                    </div>

                    {bundle.description && (
                      <p className="text-ui-fg-subtle text-sm leading-relaxed">
                        {bundle.description}
                      </p>
                    )}

                    {bundle.bundle_type &&
                      bundle.bundle_type.toLowerCase() === selectedGoal && (
                        <div className="mt-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Perfect Match
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Pricing Section */}
                  <div className="p-4 bg-ui-bg-subtle border-b border-ui-border-base">
                    {typeof bundle.total_price === "number" ? (
                      <div className="space-y-2">
                        {hasDiscount ? (
                          <>
                            <div className="flex items-baseline justify-between">
                              <span className="text-sm text-ui-fg-subtle">
                                Original Price:
                              </span>
                              <span className="text-sm text-ui-fg-subtle line-through">
                                {convertToLocale({
                                  amount: originalPrice,
                                  currency_code:
                                    bundle.currency_code ||
                                    currencyCode ||
                                    "aed",
                                })}
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between">
                              <span className="text-base font-semibold text-ui-fg-base">
                                Your Price:
                              </span>
                              <span className="text-2xl font-bold text-green-700">
                                {convertToLocale({
                                  amount: bundle.total_price,
                                  currency_code:
                                    bundle.currency_code ||
                                    currencyCode ||
                                    "aed",
                                })}
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between pt-2 border-t border-ui-border-base">
                              <span className="text-sm font-medium text-green-700">
                                You Save:
                              </span>
                              <span className="text-sm font-semibold text-green-700">
                                {convertToLocale({
                                  amount: savings,
                                  currency_code:
                                    bundle.currency_code ||
                                    currencyCode ||
                                    "aed",
                                })}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-baseline justify-between">
                            <span className="text-base font-semibold text-ui-fg-base">
                              Price:
                            </span>
                            <span className="text-2xl font-bold text-ui-fg-base">
                              {convertToLocale({
                                amount: bundle.total_price,
                                currency_code:
                                  bundle.currency_code || currencyCode || "aed",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-ui-fg-subtle">
                        Price not available
                      </p>
                    )}
                  </div>

                  {/* Nutrition Information */}
                  <div className="p-4 border-b border-ui-border-base">
                    <h4 className="text-sm font-semibold text-ui-fg-base mb-3">
                      Nutrition Facts
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {typeof bundle.total_weight === "number" && (
                        <div className="flex flex-col">
                          <span className="text-xs text-ui-fg-subtle">
                            Weight
                          </span>
                          <span className="text-sm font-semibold text-ui-fg-base">
                            {bundle.total_weight}g
                          </span>
                        </div>
                      )}
                      {typeof bundle.total_calories === "number" && (
                        <div className="flex flex-col">
                          <span className="text-xs text-ui-fg-subtle">
                            Calories
                          </span>
                          <span className="text-sm font-semibold text-ui-fg-base">
                            {bundle.total_calories}
                          </span>
                        </div>
                      )}
                      {typeof bundle.total_protein === "number" && (
                        <div className="flex flex-col">
                          <span className="text-xs text-ui-fg-subtle">
                            Protein
                          </span>
                          <span className="text-sm font-semibold text-ui-fg-base">
                            {bundle.total_protein}g
                          </span>
                        </div>
                      )}
                      {typeof bundle.total_carbs === "number" && (
                        <div className="flex flex-col">
                          <span className="text-xs text-ui-fg-subtle">
                            Carbs
                          </span>
                          <span className="text-sm font-semibold text-ui-fg-base">
                            {bundle.total_carbs}g
                          </span>
                        </div>
                      )}
                      {typeof bundle.total_fat === "number" && (
                        <div className="flex flex-col">
                          <span className="text-xs text-ui-fg-subtle">Fat</span>
                          <span className="text-sm font-semibold text-ui-fg-base">
                            {bundle.total_fat}g
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bundle Items */}
                  <div className="p-4 border-b border-ui-border-base flex-1">
                    <h4 className="text-sm font-semibold text-ui-fg-base mb-2">
                      What's Included ({bundle.items.length})
                    </h4>
                    <ul className="space-y-1">
                      {bundle.items.map((item) => (
                        <li
                          key={item.id}
                          className="text-sm text-ui-fg-subtle flex items-start gap-2"
                        >
                          <span className="text-ui-fg-muted mt-0.5">•</span>
                          <span className="flex-1">
                            <span className="font-medium text-ui-fg-base">
                              {item.product_title}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-ui-fg-muted">
                                {" "}
                                × {item.quantity}
                              </span>
                            )}
                            {typeof item.weight === "number" &&
                              item.weight > 0 && (
                                <span className="text-ui-fg-muted">
                                  {" "}
                                  ({item.weight}g)
                                </span>
                              )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="p-4">
                    <Button
                      variant="primary"
                      className="w-full"
                      isLoading={isAddingId === bundle.id}
                      disabled={isAddingId !== null}
                      onClick={() => onAddBundle(bundle.id)}
                    >
                      {isAddingId === bundle.id ? "Adding..." : "Add to Cart"}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>

          {recommendedBundles.length < bundles.length && (
            <div className="mt-8 text-center p-6 bg-ui-bg-subtle rounded-lg">
              <p className="text-ui-fg-muted mb-3">
                Looking for something else?
              </p>
              <Button onClick={resetSelection} variant="secondary">
                View All Goals
              </Button>
            </div>
          )}
        </>
      )}

      {message && (
        <div
          className={`mt-6 p-4 rounded-md ${
            message.includes("success")
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}
    </section>
  )
}

export default BundleRecommender
