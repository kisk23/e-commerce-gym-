type SectionTone = "paper" | "beige" | "primary"

const toneClasses: Record<SectionTone, string> = {
  paper: "bg-background text-foreground",
  beige: "bg-[rgb(var(--beige))]/40 text-foreground",
  primary: "bg-[rgb(var(--primary))] text-background",
}

type SectionProps = {
  id?: string
  tone?: SectionTone
  className?: string
  children: React.ReactNode
}

export function Section({
  id,
  tone = "paper",
  className = "",
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`py-20 md:py-28 lg:py-32 ${toneClasses[tone]} ${className}`}
    >
      {children}
    </section>
  )
}
