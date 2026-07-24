import Image from "next/image"
import { Section } from "@/modules/business/ui/Section"
import { sustainabilityPillars } from "@/modules/business/data/content"
import { assets } from "@/modules/business/data/assets"

export function Sustainability() {
  return (
    <Section id="sustainability" tone="primary">
      <div className="content-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <h2 className="text-6xl text-white/90 font-semibold mb-12 leading-tight">
              Sustainability is our foundation.
            </h2>
            <div className="space-y-10">
              {sustainabilityPillars.map((pillar) => (
                <div key={pillar.index} className="flex gap-6 sm:gap-8">
                  <span className="font-label text-4xl sm:text-5xl font-semibold text-[rgb(var(--secondary))]/80 shrink-0">
                    {pillar.index}
                  </span>
                  <div>
                    <h4 className="text-xl sm:text-2xl font-semibold text-white/90 mb-2">
                      {pillar.title}
                    </h4>
                    <p className="text-white/60 text-base sm:text-lg">
                      {pillar.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[400px] sm:h-[520px] rounded-xl overflow-hidden shadow-2xl rotate-2">
            <Image
              src={assets.sustainability.src}
              alt={assets.sustainability.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </Section>
  )
}
