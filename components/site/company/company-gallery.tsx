"use client"

import { useState } from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"

type GalleryImage = {
    id: number
    image: string
    sortOrder: number
}

type CompanyGalleryProps = {
    images: GalleryImage[]
    companyName: string
}

export function CompanyGallery({ images, companyName }: CompanyGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0)

    if (images.length === 0) {
        return (
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-sm">
                No photos
            </div>
        )
    }

    const active = images[activeIndex]

    return (
        <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
                <Image
                    key={active.image}
                    src={active.image}
                    alt={`${companyName} — photo ${activeIndex + 1}`}
                    fill
                    priority={activeIndex === 0}
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {images.map((img, index) => (
                        <button
                            key={img.id}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={cn(
                                "relative aspect-square overflow-hidden rounded-lg bg-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                activeIndex === index
                                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                    : "opacity-70 hover:opacity-100"
                            )}
                            aria-label={`Show photo ${index + 1}`}
                            aria-pressed={activeIndex === index}
                        >
                            <Image
                                src={img.image}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="120px"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}