import { Section } from "@/modules/business/ui/Section"
import { SectionHeading } from "@/modules/business/ui/SectionHeading"
import { FeatureCard } from "@/modules/business/ui/FeatureCard"
import { industries } from "@/modules/business/data/content"

export function Industries() {
  return (
    <Section tone="paper">
      <div className="content-container">
        <SectionHeading
          title="Industries We Serve"
          description="Tailored supply chain solutions for the MENA region's leading sectors."
          className="mb-16"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((industry) => (
            <FeatureCard
              key={industry.title}
              icon={industry.icon}
              title={industry.title}
              body={industry.body}
              align="center"
            />
          ))}
        </div>
      </div>
    </Section>
  )
}
