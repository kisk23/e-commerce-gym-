import Image from "next/image"
import { Section } from "@/modules/business/ui/Section"
import { FeatureCard } from "@/modules/business/ui/FeatureCard"
import { assets } from "@/modules/business/data/assets"
import { whyChooseFeatures } from "@/modules/business/data/content"

export function WhyChoose() {
  return (
    <Section tone="paper">
      <div className="content-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div>
            <h2 className="text-5xl text-primary font-semibold mb-12">Why Choose Elvar?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
              {whyChooseFeatures.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  body={feature.body}
                  variant="plain"
                  align="left"
                />
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative h-[420px] sm:h-[560px] rounded-xl overflow-hidden shadow-xl">
              <Image
                src={assets.whyChoose.src}
                alt={assets.whyChoose.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-8 bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-xl shadow-xl border border-[rgb(var(--primary))]/10">
              <div className="text-4xl sm:text-5xl font-display text-[rgb(var(--primary))] mb-1">
                100%
              </div>
              <div className="text-[rgb(var(--secondary))] font-semibold uppercase tracking-widest text-xs">
                Quality Controlled
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
