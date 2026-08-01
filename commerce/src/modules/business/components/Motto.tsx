import { Quote } from "lucide-react"
import { Section } from "@/modules/business/ui/Section"
import { mottoBadges } from "@/modules/business/data/content"

export function Motto() {
  return (
    <Section tone="beige">
      <div className="content-container text-center">
        <Quote
          className="w-12 h-12 text-[rgb(var(--secondary))]/80 mx-auto mb-8"
          strokeWidth={2}
          aria-hidden="true"
        />
        <h2 className="text-4xl md:text-5xl font-semibold text-primary italic max-w-4xl mx-auto leading-tight mb-16">
          &ldquo;Fresh Produce. Reliable Supply. Trusted Partnership.&rdquo;
        </h2>

        <div className="flex flex-wrap justify-center gap-10 sm:gap-16">
          {mottoBadges.map((badge) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-background flex items-center justify-center shadow-lg">
                  <Icon
                    className="w-6 h-6 text-[rgb(var(--primary))]"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </div>
                <span className="font-label text-[10px] text-[rgb(var(--primary))] uppercase tracking-[0.2em] font-semibold">
                  {badge.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
