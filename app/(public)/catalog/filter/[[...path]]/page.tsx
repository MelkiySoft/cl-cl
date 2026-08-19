import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
    getCategoryByPath,
    getCategoryTree,
    getCompaniesByCategoryId,
    type CompanySort,
} from "@/lib/categories"
import { CategorySidebar } from "@/components/site/catalog/category-sidebar"
import { CompanyGrid } from "@/components/site/catalog/company-grid"
import { CatalogToolbar } from "@/components/site/catalog/catalog-toolbar"
import { CatalogPagination } from "@/components/site/catalog/catalog-pagination"
import { Suspense } from "react"

type PageProps = {
    params: Promise<{ path?: string[] }>
    searchParams: Promise<{
        sort?: string
        limit?: string
        page?: string
    }>
}

export async function generateMetadata({
                                           params,
                                       }: PageProps): Promise<Metadata> {
    const { path } = await params
    const slugs = path ?? []

    if (slugs.length === 0) {
        return {
            title: "Catalog — Cleaning Companies",
            description: "Browse cleaning companies by category",
        }
    }

    const category = await getCategoryByPath(slugs)
    if (!category) return { title: "Category not found" }

    return {
        title: category.metaTitle || `${category.name} — Cleaning Companies`,
        description:
            category.metaDescription ||
            category.description ||
            `Find cleaning companies in ${category.name}`,
    }
}

export default async function CatalogFilterPage({
                                                    params,
                                                    searchParams,
                                                }: PageProps) {
    const { path } = await params
    const sp = await searchParams
    const slugs = path ?? []

    const sort = (sp.sort as CompanySort) || "sort_order"
    const limit = Number(sp.limit) || 15
    const page = Number(sp.page) || 1

    const [tree, category] = await Promise.all([
        getCategoryTree(),
        slugs.length > 0 ? getCategoryByPath(slugs) : Promise.resolve(null),
    ])

    if (slugs.length > 0 && !category) {
        notFound()
    }

    const { companies, total, totalPages } = await getCompaniesByCategoryId({
        categoryId: category?.id ?? null,
        sort,
        limit,
        page,
    })

    const title = category?.metaH1 || category?.name || "All Cleaning Companies"
    const currentSlug = category?.slug

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            {/* Breadcrumbs */}
            <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                    Home
                </Link>
                <span>/</span>
                {category ? (
                    <>
                        <Link
                            href="/catalog"
                            className="hover:text-foreground transition-colors"
                        >
                            Catalog
                        </Link>
                        {category.breadcrumbs.map((crumb, i) => {
                            const isLast = i === category.breadcrumbs.length - 1
                            const crumbPath = category.breadcrumbs
                                .slice(0, i + 1)
                                .map((c) => c.slug)
                                .join("/")

                            return (
                                <span key={crumb.id} className="flex items-center gap-1.5">
                                    <span>/</span>
                                    {isLast ? (
                                        <span className="text-foreground font-medium">
                                            {crumb.name}
                                        </span>
                                    ) : (
                                        <Link
                                            href={`/catalog/${crumbPath}`}
                                            className="hover:text-foreground transition-colors"
                                        >
                                            {crumb.name}
                                        </Link>
                                    )}
                                </span>
                            )
                        })}
                    </>
                ) : (
                    <span className="text-foreground font-medium">Catalog</span>
                )}
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
                <CategorySidebar tree={tree} currentSlug={currentSlug} />

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