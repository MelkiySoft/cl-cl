import type { CompanySort } from "@/lib/categories"
import {
    buildFilterSegment,
    splitPathAndFilter,
    type CatalogFilters,
} from "@/lib/catalog-filters"

export function parseCatalogPath(
    path: string[] | undefined,
    publicCitySlugs?: Iterable<string>
): {
    citySlug: string | null
    categorySlugs: string[]
    filterSegment: string | null
} {
    const { pathWithoutFilter, filterSegment } = splitPathAndFilter(path)
    const slugs = pathWithoutFilter

    if (slugs.length === 0) {
        return { citySlug: null, categorySlugs: [], filterSegment }
    }

    const known = publicCitySlugs ? new Set(publicCitySlugs) : null
    if (known?.has(slugs[0])) {
        return {
            citySlug: slugs[0],
            categorySlugs: slugs.slice(1),
            filterSegment,
        }
    }

    return { citySlug: null, categorySlugs: slugs, filterSegment }
}

export function parseCatalogPathname(
    pathname: string,
    publicCitySlugs?: Iterable<string>
): {
    citySlug: string | null
    categorySlugs: string[]
    filterSegment: string | null
} {
    const parts = pathname.split("/").filter(Boolean)
    if (parts[0] !== "catalog") {
        return { citySlug: null, categorySlugs: [], filterSegment: null }
    }

    // legacy /catalog/filter/... — игнорируем сегмент filter
    const segs = parts[1] === "filter" ? parts.slice(2) : parts.slice(1)
    return parseCatalogPath(segs, publicCitySlugs)
}

export function buildCatalogPath(opts: {
    citySlug?: string | null
    categorySlugs?: string[]
    /** токены фильтра (без префикса f-); будут отсортированы */
    filterTokens?: string[] | null
}): string {
    const parts: string[] = []
    if (opts.citySlug) parts.push(opts.citySlug)
    if (opts.categorySlugs?.length) parts.push(...opts.categorySlugs)

    const filterSeg = opts.filterTokens
        ? buildFilterSegment(opts.filterTokens)
        : null
    if (filterSeg) parts.push(filterSeg)

    return parts.length ? `/catalog/${parts.join("/")}` : "/catalog"
}

/**
 * Canonical path без фильтра (для robots / redirect target).
 */
export function buildCatalogPathWithoutFilter(opts: {
    citySlug?: string | null
    categorySlugs?: string[]
}): string {
    return buildCatalogPath({
        citySlug: opts.citySlug,
        categorySlugs: opts.categorySlugs,
    })
}

const CATALOG_SORTS: CompanySort[] = [
    "sort_order",
    "name_asc",
    "name_desc",
    "newest",
    "viewed",
]

const CATALOG_LIMITS = [15, 30, 60, 120] as const

function firstQueryValue(
    value: string | string[] | undefined
): string | undefined {
    if (Array.isArray(value)) return value[0]
    return value
}

export type CatalogSearchParams = {
    sort?: string | string[]
    limit?: string | string[]
    page?: string | string[]
}

export function parseCatalogSearchParams(sp: CatalogSearchParams): {
    sort: CompanySort
    limit: number
    page: number
} {
    const sortRaw = firstQueryValue(sp.sort)
    const sort = CATALOG_SORTS.includes(sortRaw as CompanySort)
        ? (sortRaw as CompanySort)
        : "sort_order"

    const limitRaw = Number(firstQueryValue(sp.limit))
    const limit = (CATALOG_LIMITS as readonly number[]).includes(limitRaw)
        ? limitRaw
        : 15

    const pageRaw = Number(firstQueryValue(sp.page))
    const page =
        Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1

    return { sort, limit, page }
}

export type { CatalogFilters }
