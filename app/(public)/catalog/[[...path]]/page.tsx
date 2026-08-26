import type { Metadata } from "next"
import { AppLink } from "@/components/ui/app-link"
import { notFound } from "next/navigation"
import {
    getCategoryByPath,
    getCategoryTree,
    getCompaniesByCategoryId,
} from "@/lib/categories"
import { parseCatalogPath, buildCatalogPath } from "@/lib/catalog-path"
import { getPublicCityBySlug } from "@/lib/geo"
import { SSG_CITY_SLUGS } from "@/config/cities"
import { CategorySidebar } from "@/components/site/catalog/category-sidebar"
import { CompanyGrid } from "@/components/site/catalog/company-grid"
import { CatalogToolbar } from "@/components/site/catalog/catalog-toolbar"
import { CatalogPagination } from "@/components/site/catalog/catalog-pagination"
import { Suspense } from "react"

export const revalidate = 3600

type PageProps = {
    params: Promise<{ path?: string[] }>
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

        for (const citySlug of SSG_CITY_SLUGS) {
            paths.push({ path: [citySlug] })
            for (const root of tree) {
                paths.push({ path: [citySlug, root.slug] })
            }
        }

        return paths
    } catch (error) {
        console.error("generateStaticParams catalog error:", error)
        return [{ path: undefined }]
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { path } = await params
    const { citySlug, categorySlugs } = parseCatalogPath(path)

    const [city, category] = await Promise.all([
        citySlug ? getPublicCityBySlug(citySlug) : Promise.resolve(null),
        categorySlugs.length > 0
            ? getCategoryByPath(categorySlugs)
            : Promise.resolve(null),
    ])

    if (citySlug && !city) return { title: "City not found" }
    if (categorySlugs.length > 0 && !category) return { title: "Category not found" }

    const location = city ? `${city.city}, ${city.stateId}` : null

    if (!city && !category) {
        return {
            title: "Catalog — Cleaning Companies",
            description: "Browse cleaning companies by category",
        }
    }

    if (city && !category) {
        return {
            title: `Cleaning Companies in ${location}`,
            description: `Find cleaning companies in ${location}`,
        }
    }

    if (city && category) {
        return {
            title: category.metaTitle || `${category.name} in ${location}`,
            description:
                category.metaDescription ||
                category.description ||
                `Find ${category.name.toLowerCase()} companies in ${location}`,
        }
    }

    return {
        title: category!.metaTitle || `${category!.name} — Cleaning Companies`,
        description:
            category!.metaDescription ||
            category!.description ||
            `Find cleaning companies in ${category!.name}`,
    }
}

export default async function CatalogPage({ params }: PageProps) {
    const { path } = await params
    const { citySlug, categorySlugs } = parseCatalogPath(path)

    const sort = "sort_order"
    const limit = 15
    const page = 1

    const [tree, city, category] = await Promise.all([
        getCategoryTree(),
        citySlug ? getPublicCityBySlug(citySlug) : Promise.resolve(null),
        categorySlugs.length > 0
            ? getCategoryByPath(categorySlugs)
            : Promise.resolve(null),
    ])

    if (citySlug && !city) notFound()
    if (categorySlugs.length > 0 && !category) notFound()

    const { companies, total, totalPages } = await getCompaniesByCategoryId({
        categoryId: category?.id ?? null,
        zips: city?.zips,
        sort,
        limit,
        page,
    })

    const location = city ? `${city.city}, ${city.stateId}` : null
    const title = city && category
        ? `${category.metaH1 || category.name} in ${location}`
        : city
            ? `Cleaning Companies in ${location}`
            : category?.metaH1 || category?.name || "All Cleaning Companies"

    const currentSlug = category?.slug

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <AppLink href="/" className="hover:text-foreground transition-colors">
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
                                href={buildCatalogPath({ citySlug: city.slug })}
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
                        <span key={crumb.id} className="flex items-center gap-1.5">
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
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                {category?.description && (
                    <p className="mt-2 text-muted-foreground max-w-2xl">
                        {category.description}
                    </p>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <CategorySidebar
                    tree={tree}
                    currentSlug={currentSlug}
                    citySlug={city?.slug}
                />

                <div className="flex-1 min-w-0">
                    <Suspense fallback={null}>
                        <CatalogToolbar total={total} />
                    </Suspense>

                    <CompanyGrid companies={companies} />

                    <Suspense fallback={null}>
                        <CatalogPagination page={page} totalPages={totalPages} />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}