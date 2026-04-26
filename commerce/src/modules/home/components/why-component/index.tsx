"use client"

import Image from "next/image"

export default function WhyComponent() {
  const items = [
    {
      icon: "/icons/leaf.svg",
      bg: "bg-[#E9ECE6]",
      title: "100% Fresh & Organic",
      desc: "Sourced directly from trusted farms. Quality guaranteed with every order.",
    },
    {
      icon: "/icons/target.svg",
      bg: "bg-[#CD995F1A]",
      title: "Health Focused",
      desc: "Shop based on your health goals. Track calories and nutrition effortlessly.",
    },
    {
      icon: "/icons/clock.svg",
      bg: "bg-[#83001033]",
      title: "Fast Delivery",
      desc: "Fresh produce delivered to your door within 24 hours. Always on time.",
    },
  ]

  return (
    <section className="py-10 sm:py-12 mb-9">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-10">

        {/* HEADER */}
        <div className="text-center max-w-md flex flex-col gap-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-black">
            Why Choose Elvar?
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-gray-500">
            Your trusted partner in healthy eating
          </p>
        </div>

        {/* FEATURES */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-6">

          {items.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center gap-4"
            >
              {/* ICON */}
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center ${item.bg}`}
              >
                <Image
                  src={item.icon}
                  alt={item.title}
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>

              {/* TITLE */}
              <h3 className="text-base sm:text-lg font-semibold text-black">
                {item.title}
              </h3>

              {/* DESCRIPTION */}
              <p className="text-sm sm:text-base text-gray-500 max-w-xs">
                {item.desc}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  )
}