"use client"

import Image from "next/image"
import Link from "next/link"

export default function SaveMore() {
  return (
    <section className="w-full py-12 sm:py-16 md:py-20 bg-gradient-to-br from-[rgb(var(--primary))] to-[rgba(33,60,2,0.8)]">
      <div className="content-container flex flex-col items-center text-center gap-6 sm:gap-8">
        {/* ICON */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 opacity-90">
          <Image
            src="/icons/shield.svg" // replace with your icon
            alt="Subscription"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>

        {/* TEXT BLOCK */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 max-w-xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white">
            Save More with Subscription
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-white/90">
            Get up to 12% off on all orders with our flexible subscription
            plans. Cancel anytime, no commitment required.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/subscriptions"
          className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-4 rounded-xl bg-[rgb(var(--secondary))] text-white text-sm sm:text-base font-medium hover:opacity-90 transition"
        >
          View all
          <span className="text-lg">→</span>
        </Link>
      </div>
    </section>
  )
}
