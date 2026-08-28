"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { isPublicCitySlug } from "@/config/cities"
import {
    buildCatalogPath,
    parseCatalogPathname,
} from "@/lib/catalog-path"

const STORAGE_KEY = "cl-cl.city-slug"

export function useSelectedCity() {
    const pathname = usePathname()
    const router = useRouter()
    const urlCity = parseCatalogPathname(pathname).citySlug
    const [stored, setStored] = useState<string | null>(null)

    useEffect(() => {
        try {
            const value = localStorage.getItem(STORAGE_KEY)
            if (value && isPublicCitySlug(value)) {
                setStored(value)
            }
        } catch {
            // ignore
        }
    }, [])

    useEffect(() => {
        if (!urlCity) return
        setStored(urlCity)
        try {
            localStorage.setItem(STORAGE_KEY, urlCity)
        } catch {
            // ignore
        }
    }, [urlCity])

    const citySlug = urlCity ?? stored

    function setCity(slug: string) {
        if (!isPublicCitySlug(slug)) return
        setStored(slug)
        try {
            localStorage.setItem(STORAGE_KEY, slug)
        } catch {
            // ignore
        }
        router.push(buildCatalogPath({ citySlug: slug }))
    }

    function clearCity() {
        setStored(null)
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {
            // ignore
        }

        if (pathname.startsWith("/catalog")) {
            const { categorySlugs } = parseCatalogPathname(pathname)
            router.push(buildCatalogPath({ categorySlugs }))
        }
    }

    return { citySlug, setCity, clearCity }
}