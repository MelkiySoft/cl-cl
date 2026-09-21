"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { usePathname, useRouter } from "next/navigation"

import {
    buildCatalogPath,
    parseCatalogPathname,
} from "@/lib/catalog-path"

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

    const urlCity = parseCatalogPathname(pathname, publicSlugs).citySlug

    useEffect(() => {
        if (!urlCity) return
        writeStoredCity(urlCity)
    }, [urlCity])

    const validStored =
        stored && (publicSlugs.length === 0 || publicSlugs.includes(stored))
            ? stored
            : null
    const citySlug = urlCity ?? validStored

    function setCity(slug: string) {
        if (publicSlugs.length > 0 && !publicSlugs.includes(slug)) return
        writeStoredCity(slug)
        router.push(buildCatalogPath({ citySlug: slug }))
    }

    function clearCity() {
        writeStoredCity(null)
        if (pathname.startsWith("/catalog")) {
            const { categorySlugs } = parseCatalogPathname(pathname, publicSlugs)
            router.push(buildCatalogPath({ categorySlugs }))
        }
    }

    return { citySlug, setCity, clearCity, publicSlugs, publicCities }
}
