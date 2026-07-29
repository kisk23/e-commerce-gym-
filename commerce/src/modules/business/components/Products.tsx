import Image from "next/image"
import { Section } from "@/modules/business/ui/Section"
import { SectionHeading } from "@/modules/business/ui/SectionHeading"
import { Card } from "@/modules/business/ui/Card"
import { productCategories } from "@/modules/business/data/content"

export function Products() {
  return (
    <Section id="products" tone="beige">
      <div className="content-container">
        <SectionHeading
          title="Our Products"
          description="We supply a wide selection of premium fresh produce carefully sourced to meet the requirements of professional food businesses."
          className="mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {productCategories.map((category) => (
            <Card key={category.title} className="overflow-hidden">
              <div className="relative h-64">
                <Image
                  src={category.image.src}
                  alt={category.image.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
                <span className="absolute top-5 left-5 bg-primary text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-widest">
                  {category.tag}
                </span>
              </div>
              <div className="p-8">
                <h4 className="text-xl font-semibold text-primary mb-5">
                  {category.title}
                </h4>
                <ul className="space-y-2.5 text-foreground/70">
                  {category.items.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--accent))] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  )
}
