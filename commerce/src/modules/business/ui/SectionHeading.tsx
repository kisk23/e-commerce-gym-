type SectionHeadingProps = {
  eyebrow?: string
  title: string
  description?: string
  align?: "left" | "center"
  tone?: "dark" | "light"
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "dark",
  className = "",
}: SectionHeadingProps) {
  return (
    <div
      className={`max-w-2xl ${
        align === "center" ? "mx-auto text-center" : "text-left"
      } ${className}`}
    >
      {eyebrow && (
        <span className="font-label text-sm text-[rgb(var(--secondary))] uppercase mb-4 inline-block">
          {eyebrow}
        </span>
      )}
      <h2
        className={`text-4xl md:text-5xl mb-4 font-semibold ${
          tone === "light" ? "" : "text-primary"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`text-body-lg ${
            tone === "dark" ? "text-primary/70" : "text-background/75"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  )
}
