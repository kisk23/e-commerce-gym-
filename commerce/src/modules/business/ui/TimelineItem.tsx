import type { LucideIcon } from "lucide-react"

type TimelineItemProps = {
  icon: LucideIcon
  title: string
  body: string
  isLast?: boolean
}

export function TimelineItem({
  icon: Icon,
  title,
  body,
  isLast = false,
}: TimelineItemProps) {
  return (
    <div className="flex flex-col items-center text-center px-2 relative z-10">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg border-2 ${
          isLast
            ? "bg-[rgb(var(--secondary))] border-[rgb(var(--secondary))] text-white"
            : "bg-white border-[rgb(var(--primary))] text-[rgb(var(--primary))]"
        }`}
      >
        <Icon className="w-8 h-8" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <h6
        className={`text-lg font-semibold mb-2 ${
          isLast ? "text-[rgb(var(--secondary))]" : "text-[rgb(var(--primary))]"
        }`}
      >
        {title}
      </h6>
      <p className="text-sm text-foreground/60 max-w-[15rem]">{body}</p>
    </div>
  )
}
