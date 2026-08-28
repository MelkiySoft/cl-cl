"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapPin, X } from "lucide-react"

import { PUBLIC_CITIES } from "@/config/cities"
import { useSelectedCity } from "@/hooks/use-selected-city"
import { cn } from "@/lib/utils"

type CityPickerProps = {
    className?: string
    onPicked?: () => void
}

export function CityPicker({ className, onPicked }: CityPickerProps) {
    const { citySlug, setCity, clearCity } = useSelectedCity()
    const selected = PUBLIC_CITIES.find((c) => c.slug === citySlug) ?? null

    const [query, setQuery] = useState("")
    const [open, setOpen] = useState(false)
    const [zipError, setZipError] = useState<string | null>(null)
    const [zipLoading, setZipLoading] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", onPointerDown)
        return () => document.removeEventListener("mousedown", onPointerDown)
    }, [])

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return PUBLIC_CITIES
        return PUBLIC_CITIES.filter(
            (c) =>
                c.label.toLowerCase().includes(q) ||
                c.slug.includes(q)
        )
    }, [query])

    function pick(slug: string) {
        setCity(slug)
        setQuery("")
        setZipError(null)
        setOpen(false)
        onPicked?.()
    }

    async function submit(raw: string) {
        const value = raw.trim()
        if (!value) return

        const digits = value.replace(/\D/g, "")
        if (digits.length === 5 && /^\d{5}$/.test(digits)) {
            setZipLoading(true)
            setZipError(null)
            try {
                const res = await fetch(`/api/geo/zip?zip=${digits}`)
                const data = await res.json()
                if (!res.ok || !data.city?.slug) {
                    setZipError("We don't list this area yet")
                    setOpen(true)
                    return
                }
                pick(data.city.slug)
            } catch {
                setZipError("We don't list this area yet")
                setOpen(true)
            } finally {
                setZipLoading(false)
            }
            return
        }

        const match = PUBLIC_CITIES.find(
            (c) =>
                c.label.toLowerCase() === value.toLowerCase() ||
                c.slug === value.toLowerCase()
        )
        if (match) {
            pick(match.slug)
            return
        }

        if (filtered.length === 1) {
            pick(filtered[0].slug)
            return
        }

        setZipError(null)
        setOpen(true)
    }

    return (
        <div ref={rootRef} className={cn("relative w-full min-w-0 sm:w-56", className)}>
            <div className="flex h-9 items-center gap-1.5 rounded-md border bg-background px-2.5">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <input
                    type="text"
                    value={open || !selected ? query : selected.label}
                    placeholder="Choose your city"
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setZipError(null)
                        setOpen(true)
                    }}
                    onFocus={() => {
                        setQuery("")
                        setOpen(true)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            void submit(query || (e.target as HTMLInputElement).value)
                        }
                        if (e.key === "Escape") setOpen(false)
                    }}
                    className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoComplete="off"
                    aria-label="Choose your city"
                />
                {selected && !open && (
                    <button
                        type="button"
                        onClick={() => {
                            clearCity()
                            setQuery("")
                            setZipError(null)
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Clear city"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                    {zipLoading && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                            Looking up ZIP…
                        </p>
                    )}
                    {zipError && (
                        <p className="px-3 py-2 text-sm text-destructive">{zipError}</p>
                    )}
                    {!zipLoading && filtered.length === 0 && !zipError && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                            No cities found
                        </p>
                    )}
                    {!zipLoading &&
                        filtered.map((city) => (
                            <button
                                key={city.slug}
                                type="button"
                                onClick={() => pick(city.slug)}
                                className={cn(
                                    "flex w-full px-3 py-2 text-left text-sm hover:bg-accent",
                                    city.slug === citySlug && "bg-accent font-medium"
                                )}
                            >
                                {city.label}
                            </button>
                        ))}
                </div>
            )}
        </div>
    )
}