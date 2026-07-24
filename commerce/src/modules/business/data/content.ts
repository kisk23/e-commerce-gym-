import { assets } from "@/modules/business/data/assets"
import { Linkedin } from "@medusajs/icons"
import {
  Eye,
  Rocket,
  Leaf,
  Building2,
  UtensilsCrossed,
  ShoppingBasket,
  Truck,
  Sprout,
  ClipboardCheck,
  Snowflake,
  PackageCheck,
  Zap,
  LayoutGrid,
  FlaskConical,
  QrCode,
  Handshake,
  ShieldCheck,
  Bot,
  Thermometer,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react"

import type {
  StatItem,
  VisionMissionItem,
  ProductCategory,
  SustainabilityPillar,
  Industry,
  JourneyStep,
  FeatureItem,
  MottoBadge,
  ContactItem,
} from "@/modules/business/types"

export const siteConfig = {
  name: "Elvar",
  location: "Dubai, UAE",
  phone: "+971 54 709 9555",
  email: "sales@elvardubai.com",
}

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Products", href: "#products" },
  { label: "Sustainability", href: "#sustainability" },
  { label: "Partnership", href: "#partnership" },
]

export const aboutStats: StatItem[] = [
  { value: "2024", label: "Founded in Dubai" },
  { value: "24H", label: "Maximum delivery time" },
  { value: "MENA", label: "Regional coverage" },
  { value: "100%", label: "Digital traceability" },
]

export const visionMissionItems: VisionMissionItem[] = [
  {
    icon: Eye,
    title: "Our Vision",
    body: "To be the UAE's most trusted farm-to-business partner, setting the regional benchmark for quality, sustainability, and supply chain transparency across MENA.",
  },
  {
    icon: Rocket,
    title: "Our Mission",
    body: "To deliver premium fresh produce through sustainable agriculture, AI-guided production, and efficient logistics, ensuring product safety and environmental responsibility at every step.",
  },
]

export const productCategories: ProductCategory[] = [
  {
    tag: "Vegetables",
    title: "Field & Root Harvest",
    image: assets.products.vegetables,
    items: ["Potato & tomato", "Spring onion & garlic", "Bell peppers & chili"],
  },
  {
    tag: "Exotic Fruits",
    title: "Global Orchard Selection",
    image: assets.products.fruits,
    items: ["Mango & pomegranate", "Citrus & grapes", "Exotic strawberries"],
  },
  {
    tag: "Herbs",
    title: "Aromatic Herb Collection",
    image: assets.products.herbs,
    items: ["Basil & peppermint", "Coriander & parsley", "Micro greens"],
  },
]

export const sustainabilityPillars: SustainabilityPillar[] = [
  {
    index: "01",
    title: "IoT Monitoring",
    body: "Real-time sensors track soil health, temperature, and moisture to keep every growing cycle within its optimal range.",
  },
  {
    index: "02",
    title: "AI-Guided Farming",
    body: "Predictive models fine-tune irrigation and nutrition schedules, optimizing yield while keeping quality consistent year-round.",
  },
  {
    index: "03",
    title: "Eco-Optimized Logistics",
    body: "Efficient routing and temperature-controlled distribution designed to reduce waste, improve freshness, and lower environmental impact.",
  },
]

export const industries: Industry[] = [
  {
    icon: Building2,
    title: "Hotels & Resorts",
    body: "A consistent daily supply of premium produce that meets five-star hospitality standards.",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurants & Catering",
    body: "Flexible order volumes, custom cuts, and on-demand specialty herbs for fast-moving kitchens.",
  },
  {
    icon: ShoppingBasket,
    title: "Supermarkets & Retail",
    body: "Reliable sourcing and shelf-ready packaging built for display and rapid turnover.",
  },
  {
    icon: Truck,
    title: "Food Distributors",
    body: "Bulk supply backed by full traceability documentation and coordinated logistics support.",
  },
]

export const journeySteps: JourneyStep[] = [
  {
    icon: Sprout,
    title: "Sustainable Farm",
    body: "AI-monitored growth in carefully optimized environments.",
  },
  {
    icon: ClipboardCheck,
    title: "Quality Control",
    body: "Digital batch testing and automated sorting for every harvest.",
  },
  {
    icon: Snowflake,
    title: "Cold Storage",
    body: "Immediate cooling to lock in peak nutrient value.",
  },
  {
    icon: PackageCheck,
    title: "Eco-Friendly Packing",
    body: "Sustainable packaging tailored to each sector's needs.",
  },
  {
    icon: Truck,
    title: "24H Delivery",
    body: "Final delivery to your business, anywhere across the UAE.",
  },
]

export const whyChooseFeatures: FeatureItem[] = [
  {
    icon: Zap,
    title: "Speed",
    body: "Farm-to-delivery within 24 hours across the UAE, preserving absolute freshness.",
  },
  {
    icon: LayoutGrid,
    title: "One Supplier",
    body: "Fruits, vegetables, and herbs under one roof — fewer vendors, less complexity.",
  },
  {
    icon: FlaskConical,
    title: "Tech-Backed Quality",
    body: "AI and IoT monitoring ensure every harvest meets global premium standards.",
  },
  {
    icon: QrCode,
    title: "Full Traceability",
    body: "End-to-end digital tracking gives total confidence in origin and safety.",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    body: "Committed to eco-optimized logistics and zero-waste agricultural practices.",
  },
  {
    icon: Handshake,
    title: "Dedicated Partnership",
    body: "A personal account manager focused on your business's growth and success.",
  },
]

export const mottoBadges: MottoBadge[] = [
  { icon: ShieldCheck, label: "Food Safety Compliant" },
  { icon: Bot, label: "AI Powered" },
  { icon: Thermometer, label: "Cold Chain Logistics" },
  { icon: Leaf, label: "Sustainable Farming" },
]

export const contactItems: ContactItem[] = [
  { icon: MapPin, label: siteConfig.location },
  {
    icon: Phone,
    label: siteConfig.phone,
    href: `tel:${siteConfig.phone.replace(/\s+/g, "")}`,
  },
  { icon: Mail, label: siteConfig.email, href: `mailto:${siteConfig.email}` },
  { icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/971547099555" },
]
