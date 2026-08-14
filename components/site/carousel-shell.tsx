"use client"

import Autoplay from "embla-carousel-autoplay"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

type CarouselShellProps = {
    children: React.ReactNode
    className?: string
    /** Включить автопрокрутку. Можно просто `true` или объект с настройками */
    autoplay?: boolean | { delay?: number }
    /** Нужен ли loop (обычно true, если слайдов больше 3) */
    loop?: boolean
}

export function CarouselShell({
                                  children,
                                  className,
                                  autoplay = false,
                                  loop = false,
                              }: CarouselShellProps) {
    const plugins =
        autoplay
            ? [
                Autoplay({
                    delay: typeof autoplay === "object" ? autoplay.delay ?? 4000 : 4000,
                    stopOnInteraction: true,
                    stopOnMouseEnter: true,
                }),
            ]
            : undefined

    return (
        <Carousel
            opts={{
                align: "start",
                loop,
            }}
            plugins={plugins}
            className={cn("w-full", className)}
        >
            <CarouselContent className="-ml-4 py-3">
                {children}
            </CarouselContent>

            <CarouselPrevious className="-left-3 md:-left-5" />
            <CarouselNext className="-right-3 md:-right-5" />
        </Carousel>
    )
}