import { Section } from "@/modules/business/ui/Section"
import { TimelineItem } from "@/modules/business/ui/TimelineItem"
import { GrowthConnector } from "@/modules/business/ui/GrowthConnector"
import { journeySteps } from "@/modules/business/data/content"

export function FarmJourney() {
  return (
    <Section tone="beige">
      <div className="content-container">
        <h2 className="text-5xl text-primary font-semibold text-center mb-20">
          The Farm-to-Shelf Journey
        </h2>

        <div className="relative">
          <GrowthConnector />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 relative">
            {journeySteps.map((step, index) => (
              <TimelineItem
                key={step.title}
                icon={step.icon}
                title={step.title}
                body={step.body}
                isLast={index === journeySteps.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
