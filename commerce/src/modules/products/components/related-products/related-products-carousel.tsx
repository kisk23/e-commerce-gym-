"use client"

import { HttpTypes } from "@medusajs/types"
import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"
import ProductPreview from "../product-preview"

type Props = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
}

export default function RelatedProductsCarousel({ products, region }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
  }, [emblaApi, onSelect])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#0A0A0A]">
          You may also like
        </h2>
        
        <div className="hidden md:flex items-center gap-4">
          <button className="text-sm font-semibold text-[#1A330B] hover:text-[#2A431B] transition-colors flex items-center gap-1 group">
            View all
            <svg className="transition-transform group-hover:translate-x-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="w-10 h-10 rounded-full border border-[#E6E6E6] flex items-center justify-center text-[#0A0A0A] hover:bg-[#F5F5F5] transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              aria-label="Scroll left"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="w-10 h-10 rounded-full border border-[#E6E6E6] flex items-center justify-center text-[#0A0A0A] hover:bg-[#F5F5F5] transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              aria-label="Scroll right"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0" ref={emblaRef}>
        <div className="flex gap-6 touch-pan-x cursor-grab active:cursor-grabbing">
          {products.map((product) => (
            <div key={product.id} className="flex-[0_0_85%] sm:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(25%-18px)] min-w-0 pb-4">
              <ProductPreview region={region} product={product} />
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex md:hidden items-center justify-center mt-2">
        <button className="w-full py-3 rounded-xl border border-[#E6E6E6] text-sm font-semibold text-[#0A0A0A] hover:bg-[#F5F5F5] transition-colors">
          View all
        </button>
      </div>
    </div>
  )
}
