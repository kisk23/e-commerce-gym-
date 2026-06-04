"use client"

import { useFitnessGoal } from "./FitnessGoalContext"
import { GoalOption } from "./goal-utils"

type FitnessGoalOverlayProps = {
  goalOptions: GoalOption[]
}

export default function FitnessGoalOverlay({
  goalOptions,
}: FitnessGoalOverlayProps) {
  const { selectedGoal, setSelectedGoal, showOverlay, closeOverlay } =
    useFitnessGoal()

  if (!showOverlay) {
    return null
  }

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId as any)
    closeOverlay()

    // Custom eased scroll — far smoother than native scrollIntoView
    setTimeout(() => {
      const section = document.getElementById("bundle-recommendations")
      if (!section) return

      const targetY =
        section.getBoundingClientRect().top + window.scrollY - 80 // 80px offset for any sticky nav
      const startY = window.scrollY
      const distance = targetY - startY
      const duration = 900 // ms — longer = silkier

      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

      let startTime: number | null = null

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = easeInOutCubic(progress)

        window.scrollTo(0, startY + distance * eased)

        if (progress < 1) {
          requestAnimationFrame(step)
        }
      }

      requestAnimationFrame(step)
    }, 200) // slight pause lets the overlay disappear first
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeOverlay}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            What&apos;s Your Fitness Goal?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tell us what you&apos;re working towards, and we&apos;ll recommend
            the perfect bundles for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {goalOptions.map((goal) => (
            <button
              key={goal.id}
              onClick={() => handleGoalSelect(goal.id)}
              className="group relative rounded-xl border-2 border-gray-200 bg-white p-6 text-left hover:border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <span className="text-5xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  {goal.icon}
                </span>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {goal.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {goal.description}
                  </p>
                </div>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-6 h-6 text-blue-500"
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

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Not sure? Choose &quot;General Health&quot; to see all available
            bundles.
          </p>
        </div>
      </div>
    </div>
  )
}
