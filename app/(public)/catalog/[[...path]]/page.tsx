import type { Metadata } from "next"
import { AppLink } from "@/components/ui/app-link"
import { notFound, permanentRedirect } from "next/navigation"
import { getCategoryByPath, getCategoryTree } from "@/lib/categories"
import {
    buildCatalogPath,
    buildCatalogPathWithoutFilter,
    type CatalogSearchParams,
} from "@/lib/catalog-path"
import { resolveCatalogPath } from "@/lib/catalog-path-server"
import {
    EMPTY_FILTERS,
    hasActiveFilters,
    parseFilterSegment,
    type CatalogFilters,
} from "@/lib/catalog-filters"
import {
    formatServiceCityLabel,
    getPublicCityBySlug,
    getPublicCitySlugs,
} from "@/lib/geo"
import { CatalogFilters as CatalogFiltersUI } from "@/components/site/catalog/catalog-filters"
import {
    CatalogListing,
    CatalogListingFallback,
} from "@/components/site/catalog/catalog-listing"
import { Suspense } from "react"

export const revalidate = 60

type PageProps = {
    params: Promise<{ path?: string[] }>
    searchParams: Promise<CatalogSearchParams>
}

/**
 * Только парсинг для metadata (без redirect/notFound).
 * Невалидный сегмент → как «есть фильтр» (noindex).
 */
function filtersForMetadata(
    filterSegment: string | null
): CatalogFilters {
    if (!filterSegment) return EMPTY_FILTERS
    const parsed = parseFilterSegment(filterSegment)
    if (parsed.status === "ok" || parsed.status === "redirect") {
        return parsed.filters
    }
    // invalid / empty — считаем «активным», чтобы не индексировать мусор
    if (parsed.status === "invalid") {
        return { ...EMPTY_FILTERS, tokens: ["__invalid__"] }
    }
    return EMPTY_FILTERS
}

/**
 * Редиректы 301 и 404 — только из page (не из generateMetadata).
 */
function resolveFiltersOrRedirect(
    filterSegment: string | null,
    citySlug: string | null,
    categorySlugs: string[]
): CatalogFilters {
    if (!filterSegment) return EMPTY_FILTERS

    const parsed = parseFilterSegment(filterSegment)

    if (parsed.status === "empty") {
        permanentRedirect(
            buildCatalogPathWithoutFilter({ citySlug, categorySlugs })
        )
    }

    if (parsed.status === "invalid") {
        notFound()
    }

    if (parsed.status === "redirect") {
        permanentRedirect(
            buildCatalogPath({
                citySlug,
                categorySlugs,
                filterTokens: parsed.filters.tokens,
            })
        )
    }

    return parsed.filters
}

export async function generateStaticParams() {
    try {
        const tree = await getCategoryTree()

        const paths: { path?: string[] }[] = [
            { path: undefined }, // /catalog
        ]

        function walk(
            nodes: Awaited<ReturnType<typeof getCategoryTree>>,
            parents: string[] = []
        ) {
            for (const node of nodes) {
                const current = [...parents, node.slug]
                paths.push({ path: current })
                if (node.children.length > 0) {
                    walk(node.children, current)
                }
            }
        }

        walk(tree)

        const citySlugs = await getPublicCitySlugs()
        for (const citySlug of citySlugs) {
            paths.push({ path: [citySlug] })
            for (const root of tree) {
                paths.push({ path: [citySlug, root.slug] })
            }
        }

        // f-* сегменты в SSG не включаем — только ISR по запросу
        return paths
    } catch (error) {
        console.error("generateStaticParams catalog error:", error)
        return [{ path: undefined }]
    }
}

export async function generateMetadata({
                                           params,
                                       }: PageProps): Promise<Metadata> {
    const { path } = await params
    const { citySlug, categorySlugs, filterSegment } =
        await resolveCatalogPath(path)

    const filters = filtersForMetadata(filterSegment)
    const filtered = hasActiveFilters(filters)

    const [city, category] = await Promise.all([
        citySlug ? getPublicCityBySlug(citySlug) : Promise.resolve(null),
        categorySlugs.length > 0
            ? getCategoryByPath(categorySlugs)
            : Promise.resolve(null),
    ])

    if (citySlug && !city) return { title: "City not found" }
    if (categorySlugs.length > 0 && !category) {
        return { title: "Category not found" }
    }

    const location = city ? `${city.city}, ${city.stateId}` : null
    const canonicalPath = buildCatalogPathWithoutFilter({
        citySlug,
        categorySlugs,
    })

    const robots = filtered
        ? { index: false, follow: true }
        : { index: true, follow: true }

    const base: Metadata = {
        robots,
        alternates: { canonical: canonicalPath },
    }

    if (!city && !category) {
        return {
            ...base,
            title: "Catalog — Cleaning Companies",
            description: "Browse cleaning companies by category",
        }
    }

    if (city && !category) {
        return {
            ...base,
            title: `Cleaning Companies in ${location}`,
            description: `Find cleaning companies in ${location}`,
        }
    }

    if (city && category) {
        return {
            ...base,
            title: category.metaTitle || `${category.name} in ${location}`,
            description:
                category.metaDescription ||
                category.description ||
                `Find ${category.name.toLowerCase()} companies in ${location}`,
        }
    }

    return {
        ...base,
        title: category!.metaTitle || `${category!.name} — Cleaning Companies`,
        description:
            category!.metaDescription ||
            category!.description ||
            `Find cleaning companies in ${category!.name}`,
    }
}

export default async function CatalogPage({
                                              params,
                                              searchParams,
                                          }: PageProps) {
    const { path } = await params
    const { citySlug, categorySlugs, filterSegment } =
        await resolveCatalogPath(path)

    const filters = resolveFiltersOrRedirect(
        filterSegment,
        citySlug,
        categorySlugs
    )

    const [city, category] = await Promise.all([
        citySlug ? getPublicCityBySlug(citySlug) : Promise.resolve(null),
        categorySlugs.length > 0
            ? getCategoryByPath(categorySlugs)
            : Promise.resolve(null),
    ])

    if (citySlug && !city) notFound()
    if (categorySlugs.length > 0 && !category) notFound()

    const location = city ? `${city.city}, ${city.stateId}` : null
    const title =
        city && category
            ? `${category.metaH1 || category.name} in ${location}`
            : city
                ? `Cleaning Companies in ${location}`
                : category?.metaH1 || category?.name || "All Cleaning Companies"

    const basePath = buildCatalogPathWithoutFilter({
        citySlug: city?.slug,
        categorySlugs,
    })

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <AppLink
                    href="/"
                    className="hover:text-foreground transition-colors"
                >
                    Home
                </AppLink>
                <span>/</span>
                {city || category ? (
                    <AppLink
                        href="/catalog"
                        className="hover:text-foreground transition-colors"
                    >
                        Catalog
                    </AppLink>
                ) : (
                    <span className="text-foreground font-medium">Catalog</span>
                )}

                {city && (
                    <>
                        <span>/</span>
                        {category ? (
                            <AppLink
                                href={buildCatalogPath({
                                    citySlug: city.slug,
                                    filterTokens: filters.tokens,
                                })}
                                className="hover:text-foreground transition-colors"
                            >
                                {location}
                            </AppLink>
                        ) : (
                            <span className="text-foreground font-medium">
                                {location}
                            </span>
                        )}
                    </>
                )}

                {category?.breadcrumbs.map((crumb, i) => {
                    const isLast = i === category.breadcrumbs.length - 1
                    const crumbSlugs = category.breadcrumbs
                        .slice(0, i + 1)
                        .map((c) => c.slug)

                    return (
                        <span
                            key={crumb.id}
                            className="flex items-center gap-1.5"
                        >
                            <span>/</span>
                            {isLast ? (
                                <span className="text-foreground font-medium">
                                    {crumb.name}
                                </span>
                            ) : (
                                <AppLink
                                    href={buildCatalogPath({
                                        citySlug: city?.slug,
                                        categorySlugs: crumbSlugs,
                                        filterTokens: filters.tokens,
                                    })}
                                    className="hover:text-foreground transition-colors"
                                >
                                    {crumb.name}
                                </AppLink>
                            )}
                        </span>
                    )
                })}
            </nav>

            <div className="mb-6">
                <h1 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-5xl md:leading-[3.5rem]">
                    {title}
                </h1>
                {category?.description && (
                    <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
                        {category.description}
                    </p>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <Suspense
                    fallback={
                        <aside className="hidden w-64 shrink-0 lg:block">
                            <div className="sticky top-20 h-48 animate-pulse rounded-xl border bg-muted/40" />
                        </aside>
                    }
                >
                    <CatalogFiltersUI
                        activeTokens={filters.tokens}
                        basePath={basePath}
                        catalogCitySlug={city?.slug ?? null}
                        catalogCityLabel={
                            city
                                ? formatServiceCityLabel(
                                    city.city,
                                    city.stateId
                                )
                                : null
                        }
                    />
                </Suspense>

                <div className="flex-1 min-w-0">
                    <Suspense fallback={<CatalogListingFallback />}>
                        <CatalogListing
                            searchParams={searchParams}
                            categoryId={category?.id ?? null}
                            cityId={city?.id ?? null}
                            sCity={
                                city
                                    ? formatServiceCityLabel(
                                        city.city,
                                        city.stateId
                                    )
                                    : null
                            }
                            filters={filters}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
