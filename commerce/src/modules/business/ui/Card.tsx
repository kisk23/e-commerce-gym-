type CardProps = {
  children: React.ReactNode
  className?: string
  hoverLift?: boolean
}

export function Card({
  children,
  className = "",
  hoverLift = true,
}: CardProps) {
  return (
    <div
      className={`bg-background rounded-xl border border-[rgb(var(--primary))]/5 shadow-lg ${
        hoverLift
          ? "transition-transform duration-300 hover:-translate-y-1.5"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  )
}
