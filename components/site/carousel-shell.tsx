"use client"

import Autoplay from "embla-carousel-autoplay"

import {
    Carousel,
    CarouselContent,
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

const arrowClass =
    "size-12 bg-white/90 text-foreground border-0 shadow-sm disabled:hidden [&_svg]:!size-6"

export function CarouselShell({
                                  children,
                                  className,
                                  autoplay = false,
                                  loop = false,
                              }: CarouselShellProps) {
    const plugins = autoplay
        ? [
            Autoplay({
                delay:
                    typeof autoplay === "object"
                        ? (autoplay.delay ?? 4000)
                        : 4000,
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

            <CarouselPrevious className={cn("left-2", arrowClass)} />
            <CarouselNext className={cn("right-2", arrowClass)} />
        </Carousel>
    )
}
