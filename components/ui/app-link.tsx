"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, type ComponentProps } from "react"

type AppLinkProps = ComponentProps<typeof Link> & {
    /**
     * Prefetch при hover/focus только на устройствах с настоящим hover
     * (мышь / трекпад). На тач-устройствах prefetch не происходит.
     * @default true
     */
    prefetchOnHover?: boolean
}

export function AppLink({
                            href,
                            prefetch = false,
                            prefetchOnHover = true,
                            onMouseEnter,
                            onFocus,
                            ...props
                        }: AppLinkProps) {
    const router = useRouter()

    const doPrefetch = useCallback(() => {
        if (!prefetchOnHover) return
        if (typeof href !== "string" || !href.startsWith("/")) return

        // Проверяем только в момент hover/focus
        const canHover = window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        ).matches

        if (canHover) {
            router.prefetch(href)
        }
    }, [href, prefetchOnHover, router])

    return (
        <Link
            href={href}
            prefetch={prefetch}
            onMouseEnter={(e) => {
                doPrefetch()
                onMouseEnter?.(e)
            }}
            onFocus={(e) => {
                doPrefetch()
                onFocus?.(e)
            }}
            {...props}
        />
    )
}