"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    useCallback,
    useEffect,
    useRef,
    type ComponentProps,
} from "react"

type AppLinkProps = ComponentProps<typeof Link> & {
    /**
     * Prefetch при hover/focus только на устройствах с настоящим hover.
     * @default true
     */
    prefetchOnHover?: boolean
    /**
     * Задержка перед prefetch (мс).
     * Если курсор ушёл раньше — prefetch не произойдёт.
     * @default 100
     */
    prefetchDelay?: number
}

export function AppLink({
                            href,
                            prefetch = false,
                            prefetchOnHover = true,
                            prefetchDelay = 100,
                            onMouseEnter,
                            onMouseLeave,
                            onFocus,
                            onBlur,
                            ...props
                        }: AppLinkProps) {
    const router = useRouter()
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearPrefetchTimeout = useCallback(() => {
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }, [])

    const doPrefetch = useCallback(() => {
        if (!prefetchOnHover) return
        if (typeof href !== "string" || !href.startsWith("/")) return

        const canHover = window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        ).matches

        if (canHover) {
            router.prefetch(href)
        }
    }, [href, prefetchOnHover, router])

    const schedulePrefetch = useCallback(() => {
        clearPrefetchTimeout()
        timeoutRef.current = setTimeout(doPrefetch, prefetchDelay)
    }, [clearPrefetchTimeout, doPrefetch, prefetchDelay])

    // Очистка при размонтировании
    useEffect(() => {
        return () => clearPrefetchTimeout()
    }, [clearPrefetchTimeout])

    return (
        <Link
            href={href}
            prefetch={prefetch}
            onMouseEnter={(e) => {
                schedulePrefetch()
                onMouseEnter?.(e)
            }}
            onMouseLeave={(e) => {
                clearPrefetchTimeout()
                onMouseLeave?.(e)
            }}
            onFocus={(e) => {
                // Для клавиатуры можно оставлять почти сразу
                schedulePrefetch()
                onFocus?.(e)
            }}
            onBlur={(e) => {
                clearPrefetchTimeout()
                onBlur?.(e)
            }}
            {...props}
        />
    )
}