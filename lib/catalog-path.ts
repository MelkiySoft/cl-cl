import type { CompanySort } from "@/lib/categories"

export function parseCatalogPath(
    path: string[] | undefined,
    publicCitySlugs?: Iterable<string>
): {
    citySlug: string | null
    categorySlugs: string[]
} {
    const slugs = path ?? []
    if (slugs.length === 0) {
        return { citySlug: null, categorySlugs: [] }
    }

    const known = publicCitySlugs ? new Set(publicCitySlugs) : null
    if (known?.has(slugs[0])) {
        return { citySlug: slugs[0], categorySlugs: slugs.slice(1) }
    }

    return { citySlug: null, categorySlugs: slugs }
}

export function parseCatalogPathname(
    pathname: string,
    publicCitySlugs?: Iterable<string>
): {
    citySlug: string | null
    categorySlugs: string[]
} {
    const parts = pathname.split("/").filter(Boolean)
    if (parts[0] !== "catalog") {
        return { citySlug: null, categorySlugs: [] }
    }

    const segs = parts[1] === "filter" ? parts.slice(2) : parts.slice(1)
    return parseCatalogPath(segs, publicCitySlugs)
}

export function buildCatalogPath(opts: {
    citySlug?: string | null
    categorySlugs?: string[]
}): string {
    const parts: string[] = []
    if (opts.citySlug) parts.push(opts.citySlug)
    if (opts.categorySlugs?.length) parts.push(...opts.categorySlugs)
    return parts.length ? `/catalog/${parts.join("/")}` : "/catalog"
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
