import Image from "next/image"
import { Section } from "@/modules/business/ui/Section"
import { Stat } from "@/modules/business/ui/Stat"
import { assets } from "@/modules/business/data/assets"
import { aboutStats } from "@/modules/business/data/content"

export function About() {
  return (
    <Section id="about" tone="beige">
      <div className="content-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div className="relative h-[360px] sm:h-[460px] md:h-[560px] rounded-xl overflow-hidden shadow-lg order-2 md:order-1">
            <Image
              src={assets.about.src}
              alt={assets.about.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>

          <div className="order-1 md:order-2">
            <h2 className="text-5xl mb-6 leading-tight text-primary font-semibold">
              Fixing inefficiencies in the food supply chain
            </h2>
            <p className="text-body-lg text-foreground/70 mb-10">
              Founded in Dubai in 2024, Elvar sources, produces, and distributes
              premium fresh fruits, vegetables, and herbs. We pair AI-guided
              farming with IoT monitoring to deliver consistent quality from
              soil to shelf.
            </p>
            <div className="grid grid-cols-2 gap-x-10 gap-y-8">
              {aboutStats.map((stat) => (
                <Stat key={stat.label} value={stat.value} label={stat.label} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
