import Image from "next/image"
import { CountUpBadge } from "@/modules/business/ui/CountUpBadge"
import { assets } from "@/modules/business/data/assets"
import { siteConfig } from "@/modules/business/data/content"

export function Hero() {
  return (
    <section className="bg-background pt-16 pb-24 sm:pt-20 sm:pb-28">
      <div className="content-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div>
            <span className="font-label text-label-sm text-[rgb(var(--secondary))] uppercase mb-6 inline-block">
              B2B AgriTech Excellence
            </span>
            <h1 className="text-7xl mb-6 leading-[1.08] text-primary font-semibold">
              Premium fresh produce,
              <br />
              <span className="text-[rgb(var(--secondary))] italic">
                powered by technology.
              </span>
            </h1>
            <p className="text-body-lg text-foreground/70 mb-10 max-w-lg">
              The UAE&rsquo;s most trusted farm-to-business partner, delivering
              quality, sustainability, and transparency across the MENA region.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={`mailto:${siteConfig.email}`}
                className="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 bg-[rgb(var(--primary))] text-white hover:opacity-90 active:scale-[0.98] shadow-lg px-8 py-4 text-base sm:px-10 sm:py-5 sm:text-lg"
              >
                Request a Partnership
              </a>
              <a href="/company-profile/company%20profile.pdf" target="_blank" className="border-2 border-[rgb(var(--primary))] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))] hover:text-secondary px-8 py-4 text-base sm:px-10 sm:py-5 sm:text-lg inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300">
                Company Profile
              </a>
            </div>
          </div>

          <div className="relative h-[420px] sm:h-[520px] md:h-[640px] w-full rounded-xl overflow-hidden shadow-xl">
            <Image
              src={assets.hero.src}
              alt={assets.hero.alt}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10">
              <CountUpBadge target={100} label="Quality Guarantee" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
