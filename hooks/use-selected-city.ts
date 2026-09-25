"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { usePathname, useRouter } from "next/navigation"

import {
    buildCatalogPath,
    parseCatalogPathname,
} from "@/lib/catalog-path"
import { parseFilterSegment } from "@/lib/catalog-filters"

const STORAGE_KEY = "cl-cl.city-slug"

type PublicCity = {
    slug: string
    city: string
    stateId: string
    label: string
}

let storedCity: string | null | undefined
const cityListeners = new Set<() => void>()

function emitStoredCity() {
    for (const listener of cityListeners) listener()
}

function subscribeStoredCity(listener: () => void) {
    cityListeners.add(listener)
    return () => {
        cityListeners.delete(listener)
    }
}

function readStoredCity(): string | null {
    if (storedCity !== undefined) return storedCity
    if (typeof window === "undefined") return null
    try {
        storedCity = localStorage.getItem(STORAGE_KEY)
    } catch {
        storedCity = null
    }
    return storedCity
}

function writeStoredCity(slug: string | null) {
    if (readStoredCity() === slug) return
    storedCity = slug
    try {
        if (slug) localStorage.setItem(STORAGE_KEY, slug)
        else localStorage.removeItem(STORAGE_KEY)
    } catch {
        // ignore
    }
    emitStoredCity()
}

/** Токены фильтра без ZIP (5 цифр). */
function nonZipTokens(filterSegment: string | null): string[] {
    if (!filterSegment) return []
    const parsed = parseFilterSegment(filterSegment)
    if (parsed.status !== "ok" && parsed.status !== "redirect") return []
    return parsed.filters.tokens.filter((t) => !/^[0-9]{5}$/.test(t))
}

export type SetCityOptions = {
    /** Добавить ZIP в f-сегмент (город + zip-фильтр) */
    zip?: string
    /**
     * На /catalog сохранять category path.
     * По умолчанию true.
     */
    keepCategory?: boolean
    /**
     * Сохранять не-ZIP фильтры при смене города.
     * По умолчанию false (чистый переход).
     */
    keepOtherFilters?: boolean
}

export function useSelectedCity() {
    const pathname = usePathname()
    const router = useRouter()
    const [publicCities, setPublicCities] = useState<PublicCity[]>([])
    const publicSlugs = publicCities.map((city) => city.slug)

    const stored = useSyncExternalStore(
        subscribeStoredCity,
        readStoredCity,
        () => null
    )

    useEffect(() => {
        let cancelled = false
        void fetch("/api/geo/public-cities")
            .then((res) => res.json())
            .then((data: { cities?: PublicCity[] }) => {
                if (cancelled) return
                setPublicCities(data.cities ?? [])
            })
            .catch(() => {
                if (!cancelled) setPublicCities([])
            })
        return () => {
            cancelled = true
        }
    }, [])

    const urlParsed = parseCatalogPathname(pathname, publicSlugs)
    const urlCity = urlParsed.citySlug

    useEffect(() => {
        if (!urlCity) return
        writeStoredCity(urlCity)
    }, [urlCity])

    const validStored =
        stored && (publicSlugs.length === 0 || publicSlugs.includes(stored))
            ? stored
            : null
    const citySlug = urlCity ?? validStored

    function setCity(slug: string, opts?: SetCityOptions) {
        if (publicSlugs.length > 0 && !publicSlugs.includes(slug)) return
        writeStoredCity(slug)

        const keepCategory = opts?.keepCategory !== false
        const keepOther = opts?.keepOtherFilters === true
        const onCatalog = pathname.startsWith("/catalog")
        const parsed = onCatalog
            ? parseCatalogPathname(pathname, publicSlugs)
            : null

        const categorySlugs =
            keepCategory && parsed ? parsed.categorySlugs : undefined

        const other = keepOther && parsed
            ? nonZipTokens(parsed.filterSegment)
            : []

        const zip = opts?.zip?.replace(/\D/g, "").slice(0, 5)
        const filterTokens =
            zip && /^\d{5}$/.test(zip)
                ? [...other, zip]
                : keepOther
                    ? other
                    : undefined

        router.push(
            buildCatalogPath({
                citySlug: slug,
                categorySlugs,
                filterTokens,
            })
        )
    }

    function clearCity() {
        writeStoredCity(null)
        if (pathname.startsWith("/catalog")) {
            const { categorySlugs, filterSegment } = parseCatalogPathname(
                pathname,
                publicSlugs
            )
            // убираем город, оставляем категорию; ZIP-токены смысла без города меньше — сбрасываем только zip
            const tokens = nonZipTokens(filterSegment)
            router.push(
                buildCatalogPath({
                    categorySlugs,
                    filterTokens: tokens.length ? tokens : undefined,
                })
            )
        }
    }

    return { citySlug, setCity, clearCity, publicSlugs, publicCities }
}
