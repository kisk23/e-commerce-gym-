"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  title?: string
}

const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const [mainRef, mainApi] = useEmblaCarousel({ loop: true })
  const [thumbRef, thumbApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi || !thumbApi) return
      mainApi.scrollTo(index)
    },
    [mainApi, thumbApi]
  )

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return
    setSelectedIndex(mainApi.selectedScrollSnap())
    thumbApi.scrollTo(mainApi.selectedScrollSnap())
  }, [mainApi, thumbApi, setSelectedIndex])

  useEffect(() => {
    if (!mainApi) return
    onSelect()
    mainApi.on("select", onSelect)
    mainApi.on("reInit", onSelect)
  }, [mainApi, onSelect])

  const scrollPrev = useCallback(() => mainApi?.scrollPrev(), [mainApi])
  const scrollNext = useCallback(() => mainApi?.scrollNext(), [mainApi])

  const primaryImage = images[0]

  if (!primaryImage?.url) {
    return (
      <div className="aspect-[1.22] w-full rounded-3xl bg-[#F5F5F5]" />
    )
  }

  const hasExtraImages = images.length > 5
  const extraCount = images.length - 5

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Carousel */}
      <div className="relative w-full rounded-3xl bg-[#F5F5F5] group overflow-hidden">
        <div className="overflow-hidden h-full w-full" ref={mainRef}>
          <div className="flex h-full touch-pan-y">
            {images.map((image, index) => (
              <div key={image.id || index} className="flex-[0_0_100%] min-w-0 relative aspect-[1.1] md:aspect-[1.22]">
                {!!image.url && (
                  <Image
                    src={image.url}
                    priority={index === 0}
                    className="object-cover"
                    alt={title ? `${title} product image ${index + 1}` : "Product image"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 650px"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm z-10 transition-transform duration-300 hover:scale-105">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1.16666L8.8025 4.81833L12.8333 5.4075L9.91667 8.24833L10.605 12.2617L7 10.3658L3.395 12.2617L4.08333 8.24833L1.16667 5.4075L5.1975 4.81833L7 1.16666Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs font-semibold text-[#0A0A0A]">Best seller</span>
        </div>

        {/* Top Right Action */}
        <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#0A0A0A] shadow-sm hover:bg-white transition-all z-10 group/btn hover:scale-105 active:scale-95">
          <svg className="transition-transform group-hover/btn:scale-110" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button 
              onClick={scrollPrev}
              className="absolute top-1/2 -translate-y-1/2 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#0A0A0A] shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white z-10 hover:scale-105 active:scale-95"
              aria-label="Previous image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              onClick={scrollNext}
              className="absolute top-1/2 -translate-y-1/2 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[#0A0A0A] shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white z-10 hover:scale-105 active:scale-95"
              aria-label="Next image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Carousel */}
      {images.length > 1 && (
        <div className="overflow-hidden" ref={thumbRef}>
          <div className="flex gap-3 touch-pan-x">
            {images.slice(0, 5).map((image, index) => {
              const isLast = index === 4
              const showOverlay = isLast && hasExtraImages
              const isActive = index === selectedIndex

              return (
                <div
                  key={image.id || index}
                  onClick={() => onThumbClick(index)}
                  className={`relative flex-[0_0_calc(20%-9.6px)] aspect-square overflow-hidden rounded-xl bg-[#F5F5F5] cursor-pointer transition-all duration-300 ${
                    isActive ? "ring-2 ring-[#1A330B] ring-offset-2 ring-offset-white opacity-100 scale-[0.98]" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  {!!image.url && (
                    <>
                      <Image
                        src={image.url}
                        className="object-cover transition-transform duration-500 hover:scale-110"
                        alt={title ? `${title} thumbnail ${index + 1}` : `Product thumbnail ${index + 1}`}
                        fill
                        sizes="120px"
                      />
                      {showOverlay && (
                        <div className="absolute inset-0 bg-[#F5EFE7]/80 backdrop-blur-sm flex items-center justify-center z-10">
                          <span className="text-sm font-semibold text-[#0A0A0A] text-center leading-tight">+{extraCount}<br/>more</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageGallery
