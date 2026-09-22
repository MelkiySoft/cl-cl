"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"

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
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

    const closeLightbox = useCallback(() => setLightboxIndex(null), [])

    const showPrev = useCallback(() => {
        setLightboxIndex((current) => {
            if (current === null || images.length === 0) return current
            return (current - 1 + images.length) % images.length
        })
    }, [images.length])

    const showNext = useCallback(() => {
        setLightboxIndex((current) => {
            if (current === null || images.length === 0) return current
            return (current + 1) % images.length
        })
    }, [images.length])

    useEffect(() => {
        if (lightboxIndex === null) return

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") closeLightbox()
            if (event.key === "ArrowLeft") showPrev()
            if (event.key === "ArrowRight") showNext()
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        window.addEventListener("keydown", onKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener("keydown", onKeyDown)
        }
    }, [lightboxIndex, closeLightbox, showPrev, showNext])

    if (images.length === 0) {
        return null
    }

    return (
        <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
                <h2 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10">Photos</h2>
                <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="text-lg text-foreground hover:text-primary transition-colors"
                >
                    See all {images.length} photo{images.length === 1 ? "" : "s"} →
                </button>
            </div>

            <Carousel opts={{ align: "start", skipSnaps: false }} className="relative">
                <CarouselContent className="-ml-3">
                    {images.map((img, index) => (
                        <CarouselItem
                            key={img.id}
                            className="pl-3 basis-[78%] sm:basis-[46%] lg:basis-[32%]"
                        >
                            <button
                                type="button"
                                onClick={() => setLightboxIndex(index)}
                                className="relative block w-full overflow-hidden rounded-lg bg-muted aspect-[4/3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label={`Open photo ${index + 1} of ${images.length}`}
                            >
                                <Image
                                    src={img.image}
                                    alt={`${companyName} — photo ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 280px"
                                />
                            </button>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {images.length > 3 && (
                    <>
                        <CarouselPrevious className="left-2 size-12 bg-white/90 text-foreground border-0 shadow-sm disabled:hidden [&_svg]:!size-6" />
                        <CarouselNext className="right-2 size-12 bg-white/90 text-foreground border-0 shadow-sm disabled:hidden [&_svg]:!size-6" />
                    </>
                )}
            </Carousel>

            {lightboxIndex !== null && (
                <Lightbox
                    images={images}
                    companyName={companyName}
                    index={lightboxIndex}
                    onClose={closeLightbox}
                    onPrev={showPrev}
                    onNext={showNext}
                />
            )}
        </section>
    )
}

function Lightbox({
                      images,
                      companyName,
                      index,
                      onClose,
                      onPrev,
                      onNext,
                  }: {
    images: GalleryImage[]
    companyName: string
    index: number
    onClose: () => void
    onPrev: () => void
    onNext: () => void
}) {
    const current = images[index]

    return (
        <div
            className="fixed inset-0 z-50 flex bg-black"
            role="dialog"
            aria-modal="true"
            aria-label={`Photos for ${companyName}`}
        >
            <button
                type="button"
                className="absolute inset-0 cursor-default"
                aria-label="Close photos"
                onClick={onClose}
            />

            <div className="relative z-10 flex min-h-0 flex-1 flex-col md:flex-row">
                <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center bg-black p-4 md:p-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 text-sm text-white/90 hover:text-white"
                    >
                        ← Back to photos
                    </button>

                    {images.length > 1 && (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation()
                                onPrev()
                            }}
                            className="absolute left-3 md:left-6 z-20 size-12 rounded-full bg-white/90 text-foreground shadow-sm hover:bg-white"
                            aria-label="Previous photo"
                        >
                            <ChevronLeft className="mx-auto size-6" />
                        </button>
                    )}

                    <div className="relative h-full max-h-[78vh] w-full max-w-5xl bg-black">
                        <Image
                            src={current.image}
                            alt={`${companyName} — photo ${index + 1}`}
                            fill
                            className="object-contain"
                            sizes="80vw"
                            priority
                        />
                    </div>

                    {images.length > 1 && (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation()
                                onNext()
                            }}
                            className="absolute right-3 md:right-6 z-20 size-12 rounded-full bg-white/90 text-foreground shadow-sm hover:bg-white"
                            aria-label="Next photo"
                        >
                            <ChevronRight className="mx-auto size-6" />
                        </button>
                    )}
                </div>

                <aside className="relative z-10 w-full shrink-0 bg-white text-foreground md:h-full md:w-80 lg:w-96">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="size-5" />
                    </button>
                    <div className="p-6 pr-12">
                        <h3 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10">Photos for {companyName}</h3>
                        <p className="mt-2 text-base text-muted-foreground">
                            {index + 1} of {images.length}
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    )
}
