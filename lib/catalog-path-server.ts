import { getPublicCityBySlug, getPublicCitySlugs } from "@/lib/geo"
import { parseCatalogPathname } from "@/lib/catalog-path"

export async function resolveCatalogPath(path: string[] | undefined): Promise<{
    citySlug: string | null
    categorySlugs: string[]
}> {
    const slugs = path ?? []
    if (slugs.length === 0) {
        return { citySlug: null, categorySlugs: [] }
    }

    const city = await getPublicCityBySlug(slugs[0])
    if (city) {
        return { citySlug: city.slug, categorySlugs: slugs.slice(1) }
    }

    return { citySlug: null, categorySlugs: slugs }
}

export async function resolveCatalogPathname(pathname: string): Promise<{
    citySlug: string | null
    categorySlugs: string[]
}> {
    const slugs = await getPublicCitySlugs()
    return parseCatalogPathname(pathname, slugs)
}
