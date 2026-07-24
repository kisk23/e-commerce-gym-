import { siteConfig } from "@/modules/business/data/content"
import Image from "next/image"

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-[rgb(var(--primary))]/5 shadow-sm">
      <div className="content-container flex items-center justify-between py-5">
        <a
          href="#"
          className="font-display text-headline-md font-semibold text-[rgb(var(--primary))] tracking-tight"
        >
          <Image src="/logo.svg" alt="Logo" width={100} height={100} />
        </a>
        <div className="flex items-center gap-3">
          <a
            href="/company-profile/company%20profile.pdf"
            download="Elvar company profile.pdf"
            className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 border-2 border-[rgb(var(--primary))] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))] hover:text-secondary px-6 py-2.5 text-sm"
          >
            Download Company Profile
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 bg-[rgb(var(--primary))] text-white hover:opacity-90 active:scale-[0.98] shadow-lg px-6 py-2.5 text-sm"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </header>
  )
}
