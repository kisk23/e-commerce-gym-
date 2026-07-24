import type { LucideIcon } from "lucide-react"
import { Card } from "@/modules/business/ui/Card"

type FeatureCardProps = {
  icon: LucideIcon
  title: string
  body: string
  variant?: "card" | "plain"
  align?: "center" | "left"
  className?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  body,
  variant = "card",
  align = "center",
  className = "",
}: FeatureCardProps) {
  const isCenter = align === "center"

  const content = (
    <>
      <div
        className={
          isCenter
            ? "w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-6"
            : "mb-4"
        }
      >
        <Icon
          className={
            isCenter
              ? "w-7 h-7 text-[rgb(var(--primary))]"
              : "w-8 h-8 text-[rgb(var(--secondary))]"
          }
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
      <h5 className="text-lg font-semibold text-[rgb(var(--primary))] mb-2">
        {title}
      </h5>
      <p
        className={`text-foreground/65 text-sm leading-relaxed ${
          isCenter ? "max-w-xs" : ""
        }`}
      >
        {body}
      </p>
    </>
  )

  if (variant === "plain") {
    return (
      <div
        className={`${
          isCenter ? "flex flex-col items-center text-center" : ""
        } ${className}`}
      >
        {content}
      </div>
    )
  }

  return (
    <Card
      className={`p-8 sm:p-10 ${
        isCenter ? "flex flex-col items-center text-center" : ""
      } ${className}`}
    >
      {content}
    </Card>
  )
}
