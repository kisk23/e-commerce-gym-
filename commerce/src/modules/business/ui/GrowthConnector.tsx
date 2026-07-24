"use client"

import { useEffect, useRef, useState } from "react"

export function GrowthConnector() {
  const ref = useRef<SVGSVGElement>(null)
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setGrown(true)
      },
      { threshold: 0.3 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <svg
      ref={ref}
      className="hidden md:block absolute top-10 left-0 w-full h-6 overflow-visible z-0"
      viewBox="0 0 1000 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="0"
        x2="1000"
        y2="0"
        stroke="rgb(var(--secondary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="1000"
        strokeDashoffset={grown ? 0 : 1000}
        style={{
          transition: "stroke-dashoffset 1.6s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </svg>
  )
}
