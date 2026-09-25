import { getPublicCityBySlug, getPublicCitySlugs } from "@/lib/geo"
import { parseCatalogPath, parseCatalogPathname } from "@/lib/catalog-path"
import { splitPathAndFilter } from "@/lib/catalog-filters"

export async function resolveCatalogPath(path: string[] | undefined): Promise<{
    citySlug: string | null
    categorySlugs: string[]
    filterSegment: string | null
}> {
    const { pathWithoutFilter, filterSegment } = splitPathAndFilter(path)
    const slugs = pathWithoutFilter

    if (slugs.length === 0) {
        return { citySlug: null, categorySlugs: [], filterSegment }
    }

    const city = await getPublicCityBySlug(slugs[0])
    if (city) {
        return {
            citySlug: city.slug,
            categorySlugs: slugs.slice(1),
            filterSegment,
        }
    }

    return { citySlug: null, categorySlugs: slugs, filterSegment }
}

export async function resolveCatalogPathname(pathname: string): Promise<{
    citySlug: string | null
    categorySlugs: string[]
    filterSegment: string | null
}> {
    const slugs = await getPublicCitySlugs()
    return parseCatalogPathname(pathname, slugs)
}
