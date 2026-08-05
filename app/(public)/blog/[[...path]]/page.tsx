import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
    getBlogCategoryByPath,
    getBlogCategoryTree,
    getArticlesByCategoryId,
    type ArticleSort,
} from "@/lib/blog-categories"
import { BlogCategorySidebar } from "@/components/site/blog/blog-category-sidebar"
import { ArticleGrid } from "@/components/site/blog/article-grid"
import { BlogToolbar } from "@/components/site/blog/blog-toolbar"
import { CatalogPagination } from "@/components/site/catalog/catalog-pagination"

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
            title: "Blog — Cleaning Tips & Guides",
            description: "Practical cleaning tips, how-to guides and industry insights",
        }
    }

    const category = await getBlogCategoryByPath(slugs)
    if (!category) return { title: "Category not found" }

    return {
        title: category.metaTitle || `${category.name} — Blog`,
        description:
            category.metaDescription ||
            category.description ||
            `Articles about ${category.name}`,
    }
}

export default async function BlogPage({ params, searchParams }: PageProps) {
    const { path } = await params
    const sp = await searchParams
    const slugs = path ?? []

    const sort = (sp.sort as ArticleSort) || "newest"
    const limit = Number(sp.limit) || 12
    const page = Number(sp.page) || 1

    const [tree, category] = await Promise.all([
        getBlogCategoryTree(),
        slugs.length > 0 ? getBlogCategoryByPath(slugs) : Promise.resolve(null),
    ])

    if (slugs.length > 0 && !category) {
        notFound()
    }

    const { articles, total, totalPages } = await getArticlesByCategoryId({
        categoryId: category?.id ?? null,
        sort,
        limit,
        page,
    })

    const title = category?.metaH1 || category?.name || "Blog"
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
                            href="/blog"
                            className="hover:text-foreground transition-colors"
                        >
                            Blog
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
                                            href={`/blog/${crumbPath}`}
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
                    <span className="text-foreground font-medium">Blog</span>
                )}
            </nav>

            {/* Title */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                {category?.description && (
                    <p className="mt-2 text-muted-foreground max-w-2xl">
                        {category.description}
                    </p>
                )}
            </div>

            {/* Layout */}
            <div className="flex flex-col lg:flex-row gap-8">
                <BlogCategorySidebar tree={tree} currentSlug={currentSlug} />

                <div className="flex-1 min-w-0">
                    <BlogToolbar total={total} />
                    <ArticleGrid articles={articles} />
                    <CatalogPagination page={page} totalPages={totalPages} />
                </div>
            </div>
        </div>
    )
}