import { Section } from "@/modules/business/ui/Section";
import { contactItems, siteConfig } from "@/modules/business/data/content";

export function CTA() {
  return (
    <Section id="partnership" tone="paper" className="text-center pb-0 md:pb-0 lg:pb-0">
      <div className="content-container">
        <h2 className="text-4xl md:text-5xl max-w-5xl mx-auto font-semibold text-primary mb-8">Ready to discuss your fresh produce requirements?</h2>
        <p className="text-xl sm:text-2xl text-black/70 max-w-3xl mx-auto mb-14">
          Elvar helps businesses source premium fresh produce with dependable sourcing and reliable fresh produce supply.
        </p>
        <div className="flex flex-wrap justify-center gap-5 mb-20">
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 bg-[rgb(var(--primary))] text-white hover:opacity-90 active:scale-[0.98] shadow-lg px-8 py-4 text-base sm:px-10 sm:py-5 sm:text-lg"
          >
            Request a Partnership
          </a>
          <a
            href="/company-profile/company%20profile.pdf"
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 border-2 border-[rgb(var(--primary))] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))] hover:text-secondary px-8 py-4 text-base sm:px-10 sm:py-5 sm:text-lg"
          >
            Company Profile
          </a>
        </div>

        <div className="border-t border-[rgb(var(--primary))]/10 pt-14">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-5 text-foreground/70 font-medium">
            {contactItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <span className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-[rgb(var(--secondary))]" strokeWidth={1.75} aria-hidden="true" />
                  {item.label}
                </span>
              );

              return item.href ? (
                <a key={item.label} href={item.href} target="_blank" className="hover:text-[rgb(var(--primary))] transition-colors">
                  {content}
                </a>
              ) : (
                <span key={item.label}>{content}</span>
              );
            })}
          </div>

          <p className="mt-16 opacity-60 text-xs tracking-widest uppercase font-semibold text-[rgb(var(--primary))]">
            © {new Date().getFullYear()} Elvar. All rights reserved.
          </p>

          <div
            className="overflow-hidden mt-4 -mx-8 select-none pointer-events-none"
            aria-hidden="true"
            style={{
              maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
            }}
          >
            <p className="text-[clamp(5rem,20vw,14rem)] font-bold uppercase tracking-tighter text-[rgb(var(--primary))]/50 leading-none text-center whitespace-nowrap">
              {siteConfig.name}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
