import Image from "next/image"
import BuildCard from "../build-card"

const CardDetails = [
  {
    id: "build",
    title: "Build Your Own",
    subtitle: "Create your bundle, your way.",
    description:
      "Pick exactly what your body needs. Select fresh vegetables and fruits, control your calories, and build a bundle tailored to your health goal.",
    imageSrc: "/images/build.png",
    buttonText: "Start Building",
    href: "/build",
  },
  {
    id: "bundles",
    title: "Explore Bundles",
    subtitle: "Handpicked for your goals.",
    description:
      "Skip the guesswork. Browse curated bundles designed for weight loss, muscle gain, or balanced nutrition—ready to order instantly or not.",
    imageSrc: "/images/bundles.png",
    buttonText: "Browse Bundles →",
    href: "/bundles",
  },
]

const Hero = () => {
  return (
    <section className="w-full bg-gradient-to-br from-[#213C02]/5 via-[#DFD0BD]/30 to-[#CD995F]/10 py-12 md:py-16 lg:py-20">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-14">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
          {/* LEFT */}
          <div className="flex flex-col gap-6 max-w-xl w-full">
            {/* Badge */}
            <div className="bg-[#E9ECE6] text-[#213C02] text-sm px-4 py-2 rounded-full w-fit ">
              🌱 Smart Nutrition Shopping
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Shop Fresh Food <br />
              Based on Your <span className="text-[#213C02]">Health Goals</span>
            </h1>

            {/* Description */}
            <p className="text-gray-500 text-base sm:text-lg leading-relaxed ">
              Choose from curated bundles or build your own. Track calories,
              nutrition, and price in real-time. Achieve your wellness goals
              deliciously.
            </p>

            {/* CTA */}
            <div className="flex items-center gap-2 text-[#213C02] font-medium">
              <Image
                src="/icons/setting.svg"
                alt="settings"
                width={20}
                height={20}
              />
              <span>Set your nutrition goal</span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative w-full flex justify-center lg:justify-end">
            <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[420px] md:h-[420px] lg:w-[450px] lg:h-[450px]">
              <Image
                src="/images/hero.png"
                alt="Fresh food"
                fill
                className="object-cover rounded-2xl shadow-xl"
              />

              {/* Floating Card */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:left-[-100px] lg:translate-x-0 bg-white shadow-lg rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="bg-[#E9ECE6] p-3 rounded-full">🌿</div>
                <div>
                  <p className="font-semibold text-sm">500+</p>
                  <p className="text-xs text-gray-500">Happy Customers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {CardDetails.map((card) => (
            <BuildCard key={card.id} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero
