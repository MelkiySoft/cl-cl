"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { MapPin, Search, Tag, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSelectedCity } from "@/hooks/use-selected-city"
import { buildCatalogPath } from "@/lib/catalog-path"
import { cn } from "@/lib/utils"

export type HeroCategoryOption = {
    id: number
    name: string
    slugs: string[]
    label: string
}

type HeroBannerProps = {
    categories: HeroCategoryOption[]
}

export function HeroBanner({ categories }: HeroBannerProps) {
    const router = useRouter()
    const { citySlug, publicCities } = useSelectedCity()

    const [categoryQuery, setCategoryQuery] = useState("")
    const [categoryOpen, setCategoryOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] =
        useState<HeroCategoryOption | null>(null)

    const [locationQuery, setLocationQuery] = useState("")
    const [locationOpen, setLocationOpen] = useState(false)
    const [locationOverride, setLocationOverride] = useState<
        string | null | undefined
    >(undefined)
    const [zipError, setZipError] = useState<string | null>(null)
    const [zipLoading, setZipLoading] = useState(false)

    const categoryRef = useRef<HTMLDivElement>(null)
    const locationRef = useRef<HTMLDivElement>(null)

    const selectedCitySlug =
        locationOverride === undefined ? citySlug : locationOverride

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            const target = event.target as Node
            if (!categoryRef.current?.contains(target)) setCategoryOpen(false)
            if (!locationRef.current?.contains(target)) setLocationOpen(false)
        }
        document.addEventListener("mousedown", onPointerDown)
        return () => document.removeEventListener("mousedown", onPointerDown)
    }, [])

    const selectedCity =
        publicCities.find((city) => city.slug === selectedCitySlug) ?? null

    const filteredCategories = useMemo(() => {
        const q = categoryQuery.trim().toLowerCase()
        if (!q) return categories
        return categories.filter(
            (item) =>
                item.name.toLowerCase().includes(q) ||
                item.label.toLowerCase().includes(q)
        )
    }, [categories, categoryQuery])

    const filteredCities = useMemo(() => {
        const q = locationQuery.trim().toLowerCase()
        if (!q) return publicCities
        return publicCities.filter(
            (city) =>
                city.label.toLowerCase().includes(q) ||
                city.slug.includes(q) ||
                city.city.toLowerCase().includes(q)
        )
    }, [locationQuery, publicCities])

    function pickCategory(item: HeroCategoryOption) {
        setSelectedCategory(item)
        setCategoryQuery("")
        setCategoryOpen(false)
    }

    function pickCity(slug: string) {
        setLocationOverride(slug)
        setLocationQuery("")
        setZipError(null)
        setLocationOpen(false)
    }

    async function resolveLocation(raw: string): Promise<string | null> {
        const value = raw.trim()
        if (!value) return selectedCitySlug

        const digits = value.replace(/\D/g, "")
        if (digits.length === 5 && /^\d{5}$/.test(digits)) {
            setZipLoading(true)
            setZipError(null)
            try {
                const res = await fetch(`/api/geo/zip?zip=${digits}`)
                const data = await res.json()
                if (!res.ok || !data.city?.slug) {
                    setZipError("We don't list this area yet")
                    setLocationOpen(true)
                    return null
                }
                pickCity(data.city.slug)
                return data.city.slug as string
            } catch {
                setZipError("We don't list this area yet")
                setLocationOpen(true)
                return null
            } finally {
                setZipLoading(false)
            }
        }

        const match = publicCities.find(
            (city) =>
                city.label.toLowerCase() === value.toLowerCase() ||
                city.slug === value.toLowerCase() ||
                city.city.toLowerCase() === value.toLowerCase()
        )
        if (match) {
            pickCity(match.slug)
            return match.slug
        }

        if (filteredCities.length === 1) {
            pickCity(filteredCities[0].slug)
            return filteredCities[0].slug
        }

        if (selectedCitySlug && !value) return selectedCitySlug

        setLocationOpen(true)
        return selectedCitySlug
    }

    async function search() {
        let nextCity = selectedCitySlug
        const typedLocation = locationOpen || !selectedCity ? locationQuery : ""
        if (typedLocation.trim()) {
            nextCity = await resolveLocation(typedLocation)
            if (typedLocation.replace(/\D/g, "").length === 5 && !nextCity) {
                return
            }
        }

        let nextCategory = selectedCategory
        const typedCategory = categoryOpen || !selectedCategory ? categoryQuery : ""
        if (!nextCategory && typedCategory.trim()) {
            const exact = filteredCategories.find(
                (item) =>
                    item.name.toLowerCase() === typedCategory.trim().toLowerCase()
            )
            nextCategory = exact ?? (filteredCategories.length === 1 ? filteredCategories[0] : null)
        }

        router.push(
            buildCatalogPath({
                citySlug: nextCity,
                categorySlugs: nextCategory?.slugs,
            })
        )
    }

    return (
        <section className="relative z-20 w-full min-h-[28rem] md:min-h-[34rem]">
            <div className="absolute inset-0 overflow-hidden">
                <Image
                    src="/demo/hero-banner.jpg"
                    alt=""
                    fill
                    priority
                    className="object-cover"
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/45" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-[28rem] md:min-h-[34rem] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
                <h1 className="max-w-3xl text-[1.75rem] font-bold leading-9 tracking-tight text-white md:text-5xl md:leading-[3.5rem]">
                    Find the best cleaning companies in the USA
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-white/85">
                    Browse verified providers by category, location and ratings.
                </p>

                <form
                    className="mt-8 flex w-full flex-col gap-2 rounded-lg bg-white p-2 shadow-lg sm:flex-row sm:items-stretch"
                    onSubmit={(event) => {
                        event.preventDefault()
                        void search()
                    }}
                >
                    <div ref={categoryRef} className="relative min-w-0 flex-1">
                        <div className="flex h-12 items-center gap-2 rounded-md px-3">
                            <Tag className="size-4 shrink-0 text-muted-foreground" />
                            <input
                                type="text"
                                value={
                                    categoryOpen || !selectedCategory
                                        ? categoryQuery
                                        : selectedCategory.name
                                }
                                placeholder="Service category"
                                onChange={(e) => {
                                    setCategoryQuery(e.target.value)
                                    setSelectedCategory(null)
                                    setCategoryOpen(true)
                                }}
                                onFocus={() => {
                                    setCategoryQuery("")
                                    setCategoryOpen(true)
                                }}
                                className="h-full w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                                autoComplete="off"
                                aria-label="Service category"
                            />
                            {selectedCategory && !categoryOpen && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(null)
                                        setCategoryQuery("")
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                    aria-label="Clear category"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                        {categoryOpen && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                                {filteredCategories.length === 0 ? (
                                    <p className="px-3 py-2 text-sm text-muted-foreground">
                                        No categories found
                                    </p>
                                ) : (
                                    filteredCategories.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => pickCategory(item)}
                                            className={cn(
                                                "flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                                                selectedCategory?.id === item.id &&
                                                "bg-accent font-medium"
                                            )}
                                        >
                                            <span>{item.name}</span>
                                            {item.label !== item.name && (
                                                <span className="text-xs text-muted-foreground">
                                                    {item.label}
                                                </span>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="hidden w-px bg-border sm:block" />

                    <div ref={locationRef} className="relative min-w-0 flex-1">
                        <div className="flex h-12 items-center gap-2 rounded-md px-3">
                            <MapPin className="size-4 shrink-0 text-muted-foreground" />
                            <input
                                type="text"
                                value={
                                    locationOpen || !selectedCity
                                        ? locationQuery
                                        : selectedCity.label
                                }
                                placeholder="ZIP or city"
                                onChange={(e) => {
                                    setLocationQuery(e.target.value)
                                    setZipError(null)
                                    setLocationOpen(true)
                                }}
                                onFocus={() => {
                                    setLocationQuery("")
                                    setLocationOpen(true)
                                }}
                                className="h-full w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                                autoComplete="off"
                                aria-label="ZIP or city"
                            />
                            {selectedCity && !locationOpen && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLocationOverride(null)
                                        setLocationQuery("")
                                        setZipError(null)
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                    aria-label="Clear location"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                        {locationOpen && (
                            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                                {zipLoading && (
                                    <p className="px-3 py-2 text-sm text-muted-foreground">
                                        Looking up ZIP…
                                    </p>
                                )}
                                {zipError && (
                                    <p className="px-3 py-2 text-sm text-destructive">
                                        {zipError}
                                    </p>
                                )}
                                {!zipLoading &&
                                    filteredCities.length === 0 &&
                                    !zipError && (
                                        <p className="px-3 py-2 text-sm text-muted-foreground">
                                            No cities found
                                        </p>
                                    )}
                                {!zipLoading &&
                                    filteredCities.map((city) => (
                                        <button
                                            key={city.slug}
                                            type="button"
                                            onClick={() => pickCity(city.slug)}
                                            className={cn(
                                                "flex w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                                                city.slug === selectedCitySlug &&
                                                "bg-accent font-medium"
                                            )}
                                        >
                                            {city.label}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="h-12 shrink-0 rounded-md px-6 text-base font-semibold sm:self-center"
                    >
                        <Search className="size-4" />
                        Search
                    </Button>
                </form>
            </div>
        </section>
    )
}
