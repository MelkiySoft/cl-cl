"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, X } from "lucide-react"

import { useSelectedCity } from "@/hooks/use-selected-city"
import { cn } from "@/lib/utils"

type LocationSuggestion = {
    type: "city" | "zip"
    slug: string
    label: string
    city: string
    stateId: string
    isPublic: boolean
    zip?: string
}

type CityPickerProps = {
    className?: string
    onPicked?: () => void
}

export function CityPicker({ className, onPicked }: CityPickerProps) {
    const { citySlug, setCity, clearCity, publicCities } = useSelectedCity()
    const selected = publicCities.find((c) => c.slug === citySlug) ?? null

    const [query, setQuery] = useState("")
    const [open, setOpen] = useState(false)
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
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

    useEffect(() => {
        if (!open) return

        const q = query.trim()
        const controller = new AbortController()
        // Не показываем старый список во время debounce/запроса
        const timer = window.setTimeout(() => {
            void fetch(`/api/geo/suggest?q=${encodeURIComponent(q)}`, {
                signal: controller.signal,
            })
                .then((res) => res.json())
                .then((data: { suggestions?: LocationSuggestion[] }) => {
                    setSuggestions(data.suggestions ?? [])
                    setLoading(false)
                })
                .catch((err: unknown) => {
                    if (
                        err instanceof DOMException &&
                        err.name === "AbortError"
                    ) {
                        return
                    }
                    setSuggestions([])
                    setLoading(false)
                })
        }, 200)

        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [open, query])

    function pickCity(slug: string) {
        setCity(slug)
        setQuery("")
        setError(null)
        setOpen(false)
        onPicked?.()
    }

    function pickZip(item: LocationSuggestion) {
        if (!item.isPublic || !item.zip) {
            setError("We don't list this area yet")
            setOpen(true)
            return
        }
        setCity(item.slug, { zip: item.zip })
        setQuery("")
        setError(null)
        setOpen(false)
        onPicked?.()
    }

    function pickSuggestion(item: LocationSuggestion) {
        if (item.type === "zip") {
            pickZip(item)
            return
        }
        if (!item.isPublic) {
            setError("We don't list this area yet")
            setOpen(true)
            return
        }
        pickCity(item.slug)
    }

    async function submit(raw: string) {
        const value = raw.trim()
        if (!value) return

        setLoading(true)
        setError(null)
        try {
            const res = await fetch(
                `/api/geo/suggest?q=${encodeURIComponent(value)}`
            )
            const data = (await res.json()) as {
                suggestions?: LocationSuggestion[]
            }
            const list = data.suggestions ?? []

            const digits = value.replace(/\D/g, "")
            if (digits.length === 5) {
                const exactZip = list.find(
                    (item) => item.type === "zip" && item.zip === digits
                )
                if (exactZip) {
                    pickZip(exactZip)
                    return
                }
                setError("We don't list this area yet")
                setOpen(true)
                return
            }

            const exactCity = list.find(
                (item) =>
                    item.type === "city" &&
                    (item.label.toLowerCase() === value.toLowerCase() ||
                        item.city.toLowerCase() === value.toLowerCase() ||
                        item.slug === value.toLowerCase())
            )
            if (exactCity) {
                pickSuggestion(exactCity)
                return
            }

            if (list.length === 1) {
                pickSuggestion(list[0])
                return
            }

            setSuggestions(list)
            setOpen(true)
        } catch {
            setError("We don't list this area yet")
            setOpen(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            ref={rootRef}
            className={cn("relative w-full min-w-0 sm:w-56", className)}
        >
            <div className="flex h-9 items-center gap-1.5 rounded-md border bg-background px-2.5">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <input
                    type="text"
                    value={open || !selected ? query : selected.label}
                    placeholder="City or ZIP"
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setError(null)
                        setSuggestions([])
                        setLoading(true)
                        setOpen(true)
                    }}
                    onFocus={() => {
                        setQuery("")
                        setSuggestions([])
                        setError(null)
                        setLoading(true)
                        setOpen(true)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            void submit(
                                query || (e.target as HTMLInputElement).value
                            )
                        }
                        if (e.key === "Escape") setOpen(false)
                    }}
                    className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    autoComplete="off"
                    aria-label="City or ZIP"
                />
                {selected && !open && (
                    <button
                        type="button"
                        onClick={() => {
                            clearCity()
                            setQuery("")
                            setError(null)
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Clear city"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                    {error && (
                        <p className="px-3 py-2 text-sm text-destructive">
                            {error}
                        </p>
                    )}
                    {!loading && suggestions.length === 0 && !error && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">
                            No cities or ZIPs found
                        </p>
                    )}
                    {!loading &&
                        suggestions.map((item) => (
                            <button
                                key={`${item.type}-${item.zip ?? item.slug}`}
                                type="button"
                                onClick={() => pickSuggestion(item)}
                                className={cn(
                                    "flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent",
                                    item.type === "city" &&
                                    item.slug === citySlug &&
                                    "bg-accent font-medium"
                                )}
                            >
                                <span>{item.label}</span>
                                {item.type === "zip" && (
                                    <span className="text-xs text-muted-foreground">
                                        ZIP
                                    </span>
                                )}
                            </button>
                        ))}
                </div>
            )}
        </div>
    )
}
