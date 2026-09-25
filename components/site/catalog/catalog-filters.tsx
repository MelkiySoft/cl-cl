"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    useTransition,
} from "react"
import { ListFilter } from "lucide-react"

import {
    FILTER_UI_GROUPS,
    buildFilterSegment,
    canonicalizeTokens,
} from "@/lib/catalog-filters"
import { buildCatalogPath, parseCatalogPathname } from "@/lib/catalog-path"
import { useSelectedCity } from "@/hooks/use-selected-city"
import { cn } from "@/lib/utils"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

type CatalogFiltersProps = {
    activeTokens: string[]
    basePath: string
    /**
     * Город из path каталога (не из localStorage шапки).
     * Если задан — ZIP только этого города.
     */
    catalogCitySlug?: string | null
    catalogCityLabel?: string | null
}

type ZipSuggestion = {
    zip: string
    city: string
    stateId: string
    label: string
}

type LocationSuggestion = {
    type: "city" | "zip"
    slug: string
    label: string
    city: string
    stateId: string
    isPublic: boolean
    zip?: string
}

function ZipFilterSection({
                              activeTokens,
                              onToggleZip,
                              onPickRemoteZip,
                              catalogCitySlug,
                              catalogCityLabel,
                          }: {
    activeTokens: string[]
    onToggleZip: (zip: string) => void
    onPickRemoteZip: (citySlug: string, zip: string) => void
    catalogCitySlug?: string | null
    catalogCityLabel?: string | null
}) {
    // Только город из path каталога — не localStorage шапки
    const scopedCity =
        catalogCitySlug && catalogCityLabel
            ? {
                slug: catalogCitySlug,
                label: catalogCityLabel,
                city: catalogCityLabel.replace(/\s+[A-Za-z]{2}$/, "").trim(),
            }
            : null

    const [query, setQuery] = useState("")
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [cityZips, setCityZips] = useState<ZipSuggestion[]>([])
    const [globalSuggestions, setGlobalSuggestions] = useState<
        LocationSuggestion[]
    >([])
    const rootRef = useRef<HTMLDivElement>(null)

    const activeZips = useMemo(
        () => activeTokens.filter((t) => /^[0-9]{5}$/.test(t)),
        [activeTokens]
    )
    const activeZipSet = useMemo(() => new Set(activeZips), [activeZips])

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", onPointerDown)
        return () => document.removeEventListener("mousedown", onPointerDown)
    }, [])

    // Город в path — ZIP только этого города (scoped)
    useEffect(() => {
        if (!catalogCitySlug || !catalogCityLabel) return

        const controller = new AbortController()
        const timer = window.setTimeout(() => {
            setLoading(true)
            const params = new URLSearchParams({
                sCity: catalogCityLabel,
                publicOnly: "1",
                scoped: "1",
            })
            if (query.trim()) params.set("q", query.trim())

            void fetch(`/api/geo/zips?${params}`, {
                signal: controller.signal,
            })
                .then((res) => res.json())
                .then((data: { zips?: ZipSuggestion[] }) => {
                    setCityZips(data.zips ?? [])
                })
                .catch((err: unknown) => {
                    if (
                        err instanceof DOMException &&
                        err.name === "AbortError"
                    ) {
                        return
                    }
                    setCityZips([])
                })
                .finally(() => setLoading(false))
        }, 200)

        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [catalogCitySlug, catalogCityLabel, query])

    // Города в path нет — suggest любой ZIP/город
    useEffect(() => {
        if (catalogCitySlug || !open) return

        const q = query.trim()
        const controller = new AbortController()
        const timer = window.setTimeout(() => {
            setLoading(true)
            void fetch(`/api/geo/suggest?q=${encodeURIComponent(q)}`, {
                signal: controller.signal,
            })
                .then((res) => res.json())
                .then((data: { suggestions?: LocationSuggestion[] }) => {
                    const list = (data.suggestions ?? []).filter(
                        (s) => s.type === "zip" || s.type === "city"
                    )
                    setGlobalSuggestions(list)
                })
                .catch((err: unknown) => {
                    if (
                        err instanceof DOMException &&
                        err.name === "AbortError"
                    ) {
                        return
                    }
                    setGlobalSuggestions([])
                })
                .finally(() => setLoading(false))
        }, 250)

        return () => {
            window.clearTimeout(timer)
            controller.abort()
        }
    }, [catalogCitySlug, open, query])

    const visibleCityZips = scopedCity ? cityZips : []
    const visibleGlobal = scopedCity ? [] : globalSuggestions

    function handleGlobalPick(item: LocationSuggestion) {
        if (!item.isPublic) return
        if (item.type === "zip" && item.zip) {
            onPickRemoteZip(item.slug, item.zip)
            setQuery("")
            setOpen(false)
            return
        }
        // город без zip — только перейти в город (фильтр zip не ставим)
        onPickRemoteZip(item.slug, "")
        setQuery("")
        setOpen(false)
    }

    return (
        <div ref={rootRef} className="space-y-2">
            <p className="text-sm font-medium">ZIP</p>

            {activeZips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {activeZips.map((zip) => (
                        <button
                            key={zip}
                            type="button"
                            onClick={() => onToggleZip(zip)}
                            className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                            {zip}
                            <span aria-hidden>×</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    placeholder={
                        scopedCity
                            ? `ZIP in ${scopedCity.city}`
                            : "ZIP or city"
                    }
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    className="h-8 w-full rounded-md border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    autoComplete="off"
                    aria-label="ZIP filter"
                />

                {open && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
                        {loading && (
                            <p className="px-3 py-2 text-sm text-muted-foreground">
                                Searching…
                            </p>
                        )}

                        {scopedCity &&
                            !loading &&
                            visibleCityZips.length === 0 && (
                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                    No ZIPs found
                                </p>
                            )}

                        {scopedCity &&
                            !loading &&
                            visibleCityZips.map((item) => {
                                const checked = activeZipSet.has(item.zip)
                                return (
                                    <button
                                        key={item.zip}
                                        type="button"
                                        onClick={() => {
                                            onToggleZip(item.zip)
                                            setQuery("")
                                            setOpen(false)
                                        }}
                                        className={cn(
                                            "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent",
                                            checked && "bg-accent font-medium"
                                        )}
                                    >
                                        <span>{item.zip}</span>
                                        {checked && (
                                            <span className="text-xs text-primary">
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                )
                            })}

                        {!scopedCity &&
                            !loading &&
                            visibleGlobal.length === 0 && (
                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                    No cities or ZIPs found
                                </p>
                            )}

                        {!scopedCity &&
                            !loading &&
                            visibleGlobal.map((item) => (
                                <button
                                    key={`${item.type}-${item.zip ?? item.slug}`}
                                    type="button"
                                    onClick={() => handleGlobalPick(item)}
                                    className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent"
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

            {!scopedCity && (
                <p className="text-[11px] text-muted-foreground">
                    Pick a ZIP to open that city&apos;s catalog with the current
                    category.
                </p>
            )}
        </div>
    )
}

function FiltersBody({
                         activeTokens,
                         basePath,
                         catalogCitySlug,
                         catalogCityLabel,
                         className,
                         onNavigated,
                     }: CatalogFiltersProps & {
    className?: string
    onNavigated?: () => void
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { publicSlugs, setCity } = useSelectedCity()
    const [pending, startTransition] = useTransition()

    const activeSet = useMemo(() => new Set(activeTokens), [activeTokens])

    const navigateTokens = useCallback(
        (nextTokens: string[]) => {
            const sorted = canonicalizeTokens(nextTokens)
            const seg = buildFilterSegment(sorted)
            const path = seg ? `${basePath}/${seg}` : basePath

            const params = new URLSearchParams(searchParams.toString())
            params.delete("page")
            const qs = params.toString()

            startTransition(() => {
                router.push(qs ? `${path}?${qs}` : path)
                onNavigated?.()
            })
        },
        [basePath, router, searchParams, onNavigated]
    )

    function toggle(slug: string) {
        const next = new Set(activeSet)
        if (next.has(slug)) next.delete(slug)
        else next.add(slug)
        navigateTokens([...next])
    }

    /** Один ZIP: повторный клик снимает, другой — заменяет. */
    function toggleZip(zip: string) {
        const withoutZips = activeTokens.filter((t) => !/^[0-9]{5}$/.test(t))
        if (activeSet.has(zip)) {
            navigateTokens(withoutZips)
            return
        }
        navigateTokens([...withoutZips, zip])
    }

    function pickRemoteZip(citySlug: string, zip: string) {
        const { categorySlugs } = parseCatalogPathname(pathname, publicSlugs)
        const nonZip = activeTokens.filter((t) => !/^[0-9]{5}$/.test(t))

        startTransition(() => {
            if (zip) {
                setCity(citySlug, {
                    zip,
                    keepCategory: true,
                    keepOtherFilters: true,
                })
            } else {
                const path = buildCatalogPath({
                    citySlug,
                    categorySlugs,
                    filterTokens: nonZip.length ? nonZip : undefined,
                })
                const params = new URLSearchParams(searchParams.toString())
                params.delete("page")
                const qs = params.toString()
                router.push(qs ? `${path}?${qs}` : path)
            }
            onNavigated?.()
        })
    }

    function clearAll() {
        navigateTokens([])
    }

    return (
        <div
            className={cn(
                "space-y-5",
                pending && "opacity-70 pointer-events-none",
                className
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Filters
                </p>
                {activeTokens.length > 0 && (
                    <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>

            <ZipFilterSection
                activeTokens={activeTokens}
                onToggleZip={toggleZip}
                onPickRemoteZip={pickRemoteZip}
                catalogCitySlug={catalogCitySlug}
                catalogCityLabel={catalogCityLabel}
            />

            {FILTER_UI_GROUPS.map((group) => (
                <div key={group.id} className="space-y-2">
                    <p className="text-sm font-medium">{group.label}</p>
                    <ul className="space-y-1">
                        {group.options.map((opt) => {
                            const checked = activeSet.has(opt.slug)
                            return (
                                <li key={opt.slug}>
                                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 text-sm text-muted-foreground hover:text-foreground">
                                        <input
                                            type="checkbox"
                                            className="size-3.5 rounded border-input accent-primary"
                                            checked={checked}
                                            onChange={() => toggle(opt.slug)}
                                        />
                                        <span
                                            className={cn(
                                                checked &&
                                                "text-foreground font-medium"
                                            )}
                                        >
                                            {opt.label}
                                        </span>
                                    </label>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            ))}

            {process.env.NODE_ENV === "development" && (
                <p className="break-all text-[10px] text-muted-foreground/70">
                    {pathname}
                </p>
            )}
        </div>
    )
}

/**
 * Desktop: sticky сайдбар слева.
 * Mobile: кнопка → Sheet выезжает слева.
 */
export function CatalogFilters({
                                   activeTokens,
                                   basePath,
                                   catalogCitySlug,
                                   catalogCityLabel,
                               }: CatalogFiltersProps) {
    const [open, setOpen] = useState(false)
    const count = activeTokens.length

    return (
        <>
            <aside className="hidden w-64 shrink-0 lg:block">
                <div className="sticky top-20 rounded-xl border bg-card p-4">
                    <FiltersBody
                        activeTokens={activeTokens}
                        basePath={basePath}
                        catalogCitySlug={catalogCitySlug}
                        catalogCityLabel={catalogCityLabel}
                    />
                </div>
            </aside>

            <div className="lg:hidden mb-4">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger
                        render={
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            />
                        }
                    >
                        <ListFilter className="size-4" />
                        Filters
                        {count > 0 && (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                                {count}
                            </span>
                        )}
                    </SheetTrigger>

                    <SheetContent
                        side="left"
                        className="w-[min(100%,20rem)] overflow-y-auto p-0"
                    >
                        <SheetHeader className="border-b px-4 py-3">
                            <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="p-4">
                            <FiltersBody
                                activeTokens={activeTokens}
                                basePath={basePath}
                                catalogCitySlug={catalogCitySlug}
                                catalogCityLabel={catalogCityLabel}
                                onNavigated={() => setOpen(false)}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}

export const CatalogFiltersPanel = CatalogFilters
