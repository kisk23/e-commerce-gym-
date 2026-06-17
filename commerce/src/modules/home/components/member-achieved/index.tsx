"use client"

import Image from "next/image"
import { useState } from "react"

export default function MemberAchieved() {
  const [activeFilter, setActiveFilter] = useState("all")

  const stats = [
    { value: "30+", label: "Beta Testers", icon: "👥" },
    { value: "92%", label: "Loved Their Bundles", icon: "🎯" },
    { value: "4.8★", label: "Avg. Tester Rating", highlight: true, icon: "⭐" },
    { value: "15+", label: "Curated Bundles", icon: "📦" },
  ]

  const testimonials = [
    {
      name: "Sara A.",
      tag: "Weight Loss",
      tagColor: "bg-red-50 text-[rgb(var(--accent))]",
      image: "/images/avatar-sara.png",
      text: `"I tried the weight-loss bundle during the beta and it was exactly what I needed — fresh, well-portioned, and easy to stick with."`,
      result: "Lost 4 kg during the 4-week beta",
      rating: 5,
      timeAgo: "Beta tester",
      verified: true,
      helpful: 6,
    },
    {
      name: "Karim M.",
      tag: "Muscle Gain",
      tagColor: "bg-blue-50 text-blue-600",
      image: "/images/avatar-karim.png",
      text: `"High-protein, clean ingredients, and delivered fresh. This is exactly what I was looking for to support my training."`,
      result: "Noticed better recovery after 3 weeks",
      rating: 5,
      timeAgo: "Beta tester",
      verified: true,
      helpful: 4,
    },
    {
      name: "Layla H.",
      tag: "Eat Healthy",
      tagColor: "bg-green-50 text-green-600",
      image: "/images/avatar-layla.png",
      text: `"I loved how simple it was — just pick a bundle and everything arrives ready. It made healthy eating something I actually enjoy."`,
      result: "Switched to clean eating in 2 weeks",
      rating: 4,
      timeAgo: "Beta tester",
      verified: true,
      helpful: 8,
    },
  ]

  const Stars = ({ count }: { count: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 20 20"
          width="16"
          height="16"
          className={star <= count ? "text-amber-400" : "text-gray-200"}
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )

  return (
    <section className="py-12 sm:py-16">
      <div className="content-container flex flex-col items-center gap-10">
        {/* HEADER */}
        <div className="flex flex-col items-center text-center gap-4 max-w-xl">
          <span className="px-4 py-1 rounded-full bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-sm font-medium">
            Tested by Real People
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
            Early Feedback From Our Beta Team
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-gray-500">
            Before launching, we tested Elvar with a small group of fitness
            enthusiasts in the UAE. Here&apos;s what they had to say.
          </p>
        </div>

        {/* STATS */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm bg-white text-center transition-shadow hover:shadow-md"
            >
              <span className="text-2xl mb-1">{stat.icon}</span>
              <span
                className={`text-xl sm:text-2xl font-bold ${
                  stat.highlight
                    ? "text-[rgb(var(--secondary))]"
                    : "text-[rgb(var(--primary))]"
                }`}
              >
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm text-gray-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* FILTER PILLS */}
        <div className="flex gap-2 flex-wrap justify-center">
          {["all", "Weight Loss", "Muscle Gain", "Eat Healthy"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter
                  ? "bg-[rgb(var(--primary))] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter === "all" ? "All Reviews" : filter}
            </button>
          ))}
        </div>

        {/* TESTIMONIALS */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials
            .filter(
              (item) => activeFilter === "all" || item.tag === activeFilter
            )
            .map((item, i) => (
              <div
                key={i}
                className="flex flex-col justify-between p-6 rounded-xl border border-gray-200 shadow-sm bg-white transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {/* TOP: Stars + Badge */}
                <div className="flex items-center justify-between mb-3">
                  <Stars count={item.rating} />
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                    {item.timeAgo}
                  </span>
                </div>

                {/* TEXT */}
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
                  {item.text}
                </p>

                {/* RESULT BADGE */}
                <div className="bg-[rgb(var(--primary)/0.08)] text-[rgb(var(--primary))] text-xs sm:text-sm px-4 py-2 rounded-lg font-medium mb-4">
                  ✔ {item.result}
                </div>

                {/* USER */}
                <div className="flex items-center gap-3 border-t pt-4">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={44}
                    height={44}
                    className="rounded-full object-cover border-2 border-gray-100"
                  />

                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-gray-900">
                        {item.name}
                      </span>
                      {item.verified && (
                        <svg
                          viewBox="0 0 20 20"
                          width="14"
                          height="14"
                          fill="currentColor"
                          className="text-blue-500 flex-shrink-0"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${item.tagColor}`}
                      >
                        {item.tag}
                      </span>
                      {item.verified && (
                        <span className="text-[10px] text-gray-400">
                          Beta Tester
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* HELPFUL */}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    👍 {item.helpful} people found this helpful
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}
