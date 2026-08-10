import { assets } from "@/modules/business/data/assets"
import {
  Eye,
  Rocket,
  Building2,
  UtensilsCrossed,
  ShoppingBasket,
  Truck,
  Sprout,
  ClipboardCheck,
  Snowflake,
  PackageCheck,
  Handshake,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Package,
  Apple,
} from "lucide-react"

import type {
  StatItem,
  VisionMissionItem,
  ProductCategory,
  Industry,
  JourneyStep,
  FeatureItem,
  MottoBadge,
  ContactItem,
} from "@/modules/business/types"

export const siteConfig = {
  name: "Elvar",
  location: "Dubai, UAE",
  phone: "+971 50 520 7438",
  email: "sales@elvardubai.com",
}

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Products", href: "#products" },
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
    body: "To become one of the UAE’s most trusted B2B fresh produce suppliers by building lasting partnerships based on quality, reliability, and transparency.",
  },
  {
    icon: Rocket,
    title: "Our Mission",
    body: "To supply businesses across the UAE with premium fresh produce through dependable sourcing, strict quality standards, efficient logistics, and outstanding customer service.",
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
    icon: Handshake,
    title: "Trusted Sourcing",
    body: "We partner with trusted producers, exporters, and wholesale markets to source premium fresh produce.",
  },
  {
    icon: ClipboardCheck,
    title: "Quality Inspection",
    body: "Every order is carefully selected and checked to ensure freshness and consistent quality.",
  },
  {
    icon: PackageCheck,
    title: "Professional Packaging",
    body: "Products are prepared and packed according to your business and operational requirements.",
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    body: "Efficient logistics ensure your orders arrive on time and in excellent condition across the UAE.",
  },
  {
    icon: Handshake,
    title: "Ongoing Partnership",
    body: "We provide responsive service and dependable support to build lasting business relationships.",
  },
]

export const whyChooseFeatures: FeatureItem[] = [
  {
    icon: Package,
    title: "Reliable Sourcing",
    body: "We work with trusted producers and suppliers to ensure consistent availability and dependable quality.",
  },
  {
    icon: ShieldCheck,
    title: "Quality First",
    body: "Every order is carefully selected and handled to meet the highest standards of freshness and quality.",
  },
  {
    icon: MessageCircle,
    title: "Responsive Service",
    body: "From your first inquiry to final delivery, our team provides fast communication and dedicated support.",
  },
  {
    icon: PackageCheck,
    title: "Flexible Supply",
    body: "Whether you need scheduled deliveries or special product requests, we adapt to your business requirements.",
  },
  {
    icon: Handshake,
    title: "Long-Term Partnerships",
    body: "We believe lasting business relationships are built on trust, consistency, and mutual growth.",
  },
  {
    icon: MapPin,
    title: "UAE-Based Operations",
    body: "Operating from Dubai allows us to respond quickly and efficiently to customer needs across the UAE.",
  },
]

export const mottoBadges: MottoBadge[] = [
  {
    icon: Apple,
    label: "Premium Fresh Produce",
  },
  {
    icon: Truck,
    label: "Reliable Supply",
  },
  {
    icon: MessageCircle,
    label: "Responsive Service",
  },
  {
    icon: Handshake,
    label: "Trusted Partnerships",
  },
];

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
