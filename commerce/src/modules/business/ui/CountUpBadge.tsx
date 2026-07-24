"use client"

import { useEffect, useRef, useState } from "react"

type CountUpBadgeProps = {
  target: number
  suffix?: string
  label: string
  durationMs?: number
}

export function CountUpBadge({
  target,
  suffix = "%",
  label,
  durationMs = 1400,
}: CountUpBadgeProps) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true
          const start = performance.now()

          const tick = (now: number) => {
            const progress = Math.min((now - start) / durationMs, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
          }

          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [target, durationMs])

  return (
    <div
      ref={ref}
      className="bg-white/60 backdrop-blur-xl border border-[rgb(var(--primary))]/10 p-6 sm:p-8 rounded-xl shadow-xl"
      aria-label={`${target}${suffix} ${label}`}
    >
      <div className="font-label text-2xl sm:text-3xl text-[rgb(var(--primary))] mb-1 tabular-nums">
        {value}
        {suffix}
      </div>
      <div className="text-[rgb(var(--secondary))] font-semibold uppercase tracking-widest text-xs">
        {label}
      </div>
    </div>
  )
}
