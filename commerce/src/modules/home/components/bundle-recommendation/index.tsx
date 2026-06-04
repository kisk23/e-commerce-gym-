"use client"

import { StoreBundle } from "@lib/types/bundle"
import { useState } from "react"
import { Button } from "@medusajs/ui"
import { addBundleToCart } from "@lib/data/bundles"
import { FitnessGoalProvider, useFitnessGoal } from "./FitnessGoalContext"
import FitnessGoalOverlay from "./FitnessGoalOverlay"
import BundleView from "@modules/bundle/components/bundle-view"
import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import { GoalOption } from "./goal-utils"

type BundleRecommenderProps = {
  bundles: StoreBundle[]
  countryCode: string
  currencyCode?: string
  goalOptions: GoalOption[]
}

function BundleRecommenderContent({
  bundles,
  countryCode,
  currencyCode,
  goalOptions,
}: BundleRecommenderProps) {
  const { selectedGoal, setSelectedGoal, openOverlay } = useFitnessGoal()
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
    if (!selectedGoal) {
      return []
    }

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
    openOverlay()
    setMessage(null)
  }

  // Recommended Bundles Screen
  const recommendedBundles = getRecommendedBundles()
  const selectedGoalInfo = goalOptions.find((g) => g.id === selectedGoal)

  return (
    <>
      <FitnessGoalOverlay goalOptions={goalOptions} />
      <section id="bundle-recommendations" className="content-container py-8">
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
              {recommendedBundles.slice(0, 3).map((bundle) => (
                <BundleView
                  key={bundle.id}
                  bundle={bundle}
                  onAddToCart={() => onAddBundle(bundle.id)}
                  isAdding={isAddingId === bundle.id}
                />
              ))}
            </div>

            {recommendedBundles.length < bundles.length && (
              <div className="mt-8 text-center p-6 bg-gradient-to-br from-secondary/80 via-secondary/60 to-secondary/20 rounded-lg">
                <p className="text- mb-3">
                  Looking for something else?
                </p>
                <LocalizedClientLink href="/bundles" className="bg-primary hover:bg-primary/80 py-2 px-4 text-white/90 rounded-lg">
                  View All Bundles
                </LocalizedClientLink>
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
    </>
  )
}

const BundleRecommender = ({
  bundles,
  countryCode,
  currencyCode,
  goalOptions,
}: BundleRecommenderProps) => {
  return (
    <FitnessGoalProvider>
      <BundleRecommenderContent
        bundles={bundles}
        countryCode={countryCode}
        currencyCode={currencyCode}
        goalOptions={goalOptions}
      />
    </FitnessGoalProvider>
  )
}

export default BundleRecommender
