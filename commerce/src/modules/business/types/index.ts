import type { LucideIcon } from "lucide-react"

export type StatItem = {
  value: string
  label: string
}

export type VisionMissionItem = {
  icon: LucideIcon
  title: string
  body: string
}

export type ProductCategory = {
  tag: string
  title: string
  image: { src: string; alt: string }
  items: string[]
}

export type SustainabilityPillar = {
  index: string
  title: string
  body: string
}

export type Industry = {
  icon: LucideIcon
  title: string
  body: string
}

export type JourneyStep = {
  icon: LucideIcon
  title: string
  body: string
}

export type FeatureItem = {
  icon: LucideIcon
  title: string
  body: string
}

export type MottoBadge = {
  icon: LucideIcon
  label: string
}

export type ContactItem = {
  icon: LucideIcon | any
  label: string
  href?: string
}
