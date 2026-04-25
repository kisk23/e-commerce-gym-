"use client"

import Image from "next/image"
import type { BuildCardProps } from "@/types"
import Link from "next/link"

export default function BuildCard({
  title,
  subtitle,
  description,
  imageSrc,
  buttonText,
  href,
}: BuildCardProps) {
  return (
    <div className="w-full rounded-xl border border-[#E6E6E6] bg-white shadow-[0_3px_40px_rgba(0,0,0,0.12)] p-4 sm:p-6 flex flex-col gap-6 sm:gap-8">
      {/* Top Section */}
      <div className="flex flex-col gap-4 sm:gap-6 w-full">
        {/* Header Row */}
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Image */}
          <div className="w-[80px] h-[55px] sm:w-[100px] sm:h-[70px] md:w-[110px] md:h-[75px] relative shrink-0">
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-contain drop-shadow-md"
            />
          </div>

          {/* Title + Subtitle */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-black">
              {title}
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-500">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="hidden sm:block text-sm sm:text-base md:text-lg leading-relaxed text-[rgb(var(--primary))]">
          {description}
        </p>
      </div>

      {/* CTA */}
      <Link
        href={href}
        className="w-full text-center py-3 sm:py-4 rounded-xl bg-[rgb(var(--primary))] text-white text-sm sm:text-base md:text-lg font-medium hover:bg-[rgb(var(--primary-light))] transition-colors"
      >
        {buttonText}
      </Link>
    </div>
  )
}
