import { HttpTypes } from "@medusajs/types"
import Image from "next/image"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  title?: string
}

const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const [primaryImage, ...secondaryImages] = images

  if (!primaryImage?.url) {
    return (
      <div className="aspect-[1.22] w-full rounded-large bg-beige/30" />
    )
  }

  return (
    <div className="grid gap-3">
      <div className="relative aspect-[1.22] w-full overflow-hidden rounded-large bg-beige/30">
        <Image
          src={primaryImage.url}
          priority
          className="object-cover"
          alt={title ? `${title} product image` : "Product image"}
          fill
          sizes="(max-width: 1024px) 100vw, 650px"
        />
      </div>

      {secondaryImages.length > 0 ? (
        <div className="grid grid-cols-4 gap-3">
          {secondaryImages.slice(0, 4).map((image, index) => (
            <div
              key={image.id || image.url}
              className="relative aspect-square overflow-hidden rounded-rounded border border-beige/60 bg-white"
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  className="object-cover"
                  alt={
                    title
                      ? `${title} thumbnail ${index + 2}`
                      : `Product thumbnail ${index + 2}`
                  }
                  fill
                  sizes="120px"
                />
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default ImageGallery
