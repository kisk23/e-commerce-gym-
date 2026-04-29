"use client"

import Image from "next/image"

export default function MemberAchieved() {
  const stats = [
    { value: "12,000+", label: "Happy Members" },
    { value: "94%", label: "Reached Their Goal" },
    { value: "4.9★", label: "Average Rating", highlight: true },
    { value: "50+", label: "Curated Bundles" },
  ]

  const testimonials = [
    {
      name: "Sara Ahmed",
      tag: "Weight Loss",
      tagColor: "bg-red-50 text-[rgb(var(--accent))]",
      image: "/images/user1.png",
      text: `"Elvar completely changed how I think about food. The weight-loss bundles are perfectly portioned and so easy to follow. I never felt deprived!"`,
      result: "Lost 9 kg in 10 weeks",
    },
    {
      name: "Karim Mansour",
      tag: "Muscle Gain",
      tagColor: "bg-blue-50 text-blue-600",
      image: "/images/user1.png",
      text: `"The high-protein bundles are incredible. I got everything I needed to fuel my workouts and bulk up clean — all delivered fresh to my door every week."`,
      result: "Gained 5 kg lean mass in 8 weeks",
    },
    {
      name: "Layla Hassan",
      tag: "Eat Healthy",
      tagColor: "bg-green-50 text-green-600",
      image: "/images/user1.png",
      text: `"I used to skip meals and eat junk. Elvar's balanced bundles made healthy eating so simple and delicious. My energy levels are through the roof!"`,
      result: "Sustained healthy eating for 3 months",
    },
  ]

  return (
    <section className="py-12 sm:py-16">
      <div className="content-container flex flex-col items-center gap-10">
        {/* HEADER */}
        <div className="flex flex-col items-center text-center gap-4 max-w-xl">
          <span className="px-4 py-1 rounded-full bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-sm font-medium">
            Real People. Real Results.
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
            What Our Members Achieved
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-gray-500">
            Thousands of people transformed their health with Elvar's goal-based
            nutrition bundles.
          </p>
        </div>

        {/* STATS */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm bg-white text-center"
            >
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

        {/* TESTIMONIALS */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <div
              key={i}
              className="flex flex-col justify-between p-5 rounded-xl border border-gray-200 shadow-sm bg-white"
            >
              {/* TEXT */}
              <div className="flex flex-col gap-4">
                <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
                  {item.text}
                </p>

                {/* STARS */}
                <div className="text-[rgb(var(--secondary))] text-sm">
                  ★★★★★
                </div>
              </div>

              {/* USER */}
              <div className="flex flex-col gap-4 mt-6">
                <div className="flex items-center gap-3 border-t pt-4">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover border"
                  />

                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{item.name}</span>

                    <span
                      className={`text-xs px-2 py-1 rounded-full w-fit ${item.tagColor}`}
                    >
                      {item.tag}
                    </span>
                  </div>
                </div>

                {/* RESULT BADGE */}
                <div className="bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-xs sm:text-sm px-4 py-2 rounded-full text-center">
                  ✔ {item.result}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
