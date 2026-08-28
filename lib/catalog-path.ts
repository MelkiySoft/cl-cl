import { isPublicCitySlug } from "@/config/cities"

export function parseCatalogPath(path: string[] | undefined): {
    citySlug: string | null
    categorySlugs: string[]
} {
    const slugs = path ?? []
    if (slugs.length === 0) {
        return { citySlug: null, categorySlugs: [] }
    }

    if (isPublicCitySlug(slugs[0])) {
        return { citySlug: slugs[0], categorySlugs: slugs.slice(1) }
    }

    return { citySlug: null, categorySlugs: slugs }
}

export function parseCatalogPathname(pathname: string): {
    citySlug: string | null
    categorySlugs: string[]
} {
    const parts = pathname.split("/").filter(Boolean)
    if (parts[0] !== "catalog") {
        return { citySlug: null, categorySlugs: [] }
    }

    const segs = parts[1] === "filter" ? parts.slice(2) : parts.slice(1)
    return parseCatalogPath(segs)
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