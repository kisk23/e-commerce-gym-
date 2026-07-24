import { Section } from "@/modules/business/ui/Section"
import { visionMissionItems } from "@/modules/business/data/content"

export function VisionMission() {
  return (
    <Section tone="paper">
      <div className="content-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visionMissionItems.map((item, index) => {
            const Icon = item.icon
            const isPrimary = index === 0

            return (
              <div
                key={item.title}
                className={`p-10 sm:p-14 rounded-xl h-auto flex flex-col justify-around ${
                  isPrimary
                    ? "bg-[rgb(var(--primary))] text-background shadow-xl"
                    : "bg-[rgb(var(--beige))]/40 border border-[rgb(var(--primary))]/5"
                }`}
              >
                <Icon
                  className={`w-14 h-14 my-4 ${
                    isPrimary
                      ? "text-green-300/50"
                      : "text-[rgb(var(--secondary))]"
                  }`}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                  <h3
                    className={`text-2xl sm:text-3xl font-semibold mb-4 ${
                      isPrimary
                        ? "text-white"
                        : "text-[rgb(var(--primary))]"
                    }`}
                  >
                    {item.title}
                  </h3>
                  
                  <p
                    className={`text-lg sm:text-xl leading-relaxed font-light ${
                      isPrimary ? "text-white/90" : "text-foreground/70"
                    }`}
                  >
                    {item.body}
                  </p>
                  
              </div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}
