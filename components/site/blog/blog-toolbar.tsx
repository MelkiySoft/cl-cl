"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "viewed", label: "Most viewed" },
    { value: "title_asc", label: "Title A–Z" },
    { value: "title_desc", label: "Title Z–A" },
    { value: "sort_order", label: "Default" },
] as const

const LIMIT_OPTIONS = [12, 24, 48] as const

type BlogToolbarProps = {
    total: number
}

export function BlogToolbar({ total }: BlogToolbarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const currentSort = searchParams.get("sort") || "newest"
    const currentLimit = Number(searchParams.get("limit") || 12)

    function updateParams(key: string, value: string, defaultValue: string) {
        const params = new URLSearchParams(searchParams.toString())

        if (value === defaultValue) {
            params.delete(key)
        } else {
            params.set(key, value)
        }

        if (key === "sort" || key === "limit") {
            params.delete("page")
        }

        const qs = params.toString()
        router.push(qs ? `${pathname}?${qs}` : pathname)
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <p className="text-sm text-muted-foreground">
                {total} {total === 1 ? "article" : "articles"}
            </p>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="sort"
                        className="text-sm text-muted-foreground whitespace-nowrap"
                    >
                        Sort by
                    </label>
                    <select
                        id="sort"
                        value={currentSort}
                        onChange={(e) =>
                            updateParams("sort", e.target.value, "newest")
                        }
                        className="h-9 rounded-md border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <label
                        htmlFor="limit"
                        className="text-sm text-muted-foreground whitespace-nowrap"
                    >
                        Show
                    </label>
                    <select
                        id="limit"
                        value={currentLimit}
                        onChange={(e) =>
                            updateParams("limit", e.target.value, "12")
                        }
                        className="h-9 rounded-md border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                        {LIMIT_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}