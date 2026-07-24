type StatProps = {
  value: string
  label: string
  tone?: "dark" | "light"
  className?: string
}

export function Stat({
  value,
  label,
  tone = "dark",
  className = "",
}: StatProps) {
  return (
    <div
      className={`border-l-4 border-[rgb(var(--secondary))] pl-6 ${className}`}
    >
      <div
        className={`font-display text-3xl sm:text-4xl mb-1.5 ${
          tone === "dark" ? "text-[rgb(var(--primary))]" : "text-background"
        }`}
      >
        {value}
      </div>
      <div
        className={`font-label text-sm uppercase ${
          tone === "dark" ? "text-foreground/50" : "text-background/60"
        }`}
      >
        {label}
      </div>
    </div>
  )
}
