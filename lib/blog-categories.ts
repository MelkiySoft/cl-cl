import { cache } from "react"
import { eq, isNull, asc, desc, and, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"

import { db } from "@/db"
import {
    blogCategories,
    blogCategoryPath,
    articles,
    articleToCategory,
} from "@/db/schema"

export type BlogMenuCategoryChild = {
    id: number
    name: string
    slug: string
}

export type BlogMenuCategory = {
    id: number
    name: string
    slug: string
    children: BlogMenuCategoryChild[]
}

/**
 * Категории блога для меню (header + mobile).
 * Корневые (parentId = null) + прямые дети.
 * Только status = true, сортировка по sortOrder.
 */
export const getBlogMenuCategories = cache(
    async (): Promise<BlogMenuCategory[]> => {
        const roots = await db.query.blogCategories.findMany({
            where: and(
                isNull(blogCategories.parentId),
                eq(blogCategories.status, true)
            ),
            orderBy: [asc(blogCategories.sortOrder)],
            with: {
                children: {
                    where: eq(blogCategories.status, true),
                    orderBy: [asc(blogCategories.sortOrder)],
                    columns: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
            columns: {
                id: true,
                name: true,
                slug: true,
            },
        })

        return roots.map((root) => ({
            id: root.id,
            name: root.name,
            slug: root.slug,
            children: root.children ?? [],
        }))
    }
)

// ============================================================
// Типы для страницы блога
// ============================================================

export type BlogCategoryNode = {
    id: number
    name: string
    slug: string
    parentId: number | null
    children: BlogCategoryNode[]
}

export type CatalogArticle = {
    id: number
    title: string
    slug: string
    excerpt: string | null
    image: string | null
    publishedAt: Date | null
    viewed: number
}

export type BlogCategoryWithPath = {
    id: number
    name: string
    slug: string
    description: string | null
    metaTitle: string | null
    metaDescription: string | null
    metaH1: string | null
    breadcrumbs: { id: number; name: string; slug: string }[]
}

// ============================================================
// Дерево категорий блога для сайдбара
// ============================================================

export const getBlogCategoryTree = cache(
    async (): Promise<BlogCategoryNode[]> => {
        const all = await db.query.blogCategories.findMany({
            where: eq(blogCategories.status, true),
            orderBy: [asc(blogCategories.sortOrder)],
            columns: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
            },
        })

        const map = new Map<number, BlogCategoryNode>()
        const roots: BlogCategoryNode[] = []

        for (const c of all) {
            map.set(c.id, { ...c, children: [] })
        }

        for (const c of all) {
            const node = map.get(c.id)!
            if (c.parentId && map.has(c.parentId)) {
                map.get(c.parentId)!.children.push(node)
            } else {
                roots.push(node)
            }
        }

        return roots
    }
)

// ============================================================
// Найти категорию блога по пути slug'ов
// ============================================================

export const getBlogCategoryByPath = cache(
    async (slugs: string[]): Promise<BlogCategoryWithPath | null> => {
        if (slugs.length === 0) return null

        let parentId: number | null = null
        let current: typeof blogCategories.$inferSelect | null = null

        for (const slug of slugs) {
            let whereClause: SQL | undefined

            if (parentId === null) {
                whereClause = and(
                    eq(blogCategories.slug, slug),
                    eq(blogCategories.status, true),
                    isNull(blogCategories.parentId)
                )
            } else {
                whereClause = and(
                    eq(blogCategories.slug, slug),
                    eq(blogCategories.status, true),
                    eq(blogCategories.parentId, parentId)
                )
            }

            const found = await db.query.blogCategories.findFirst({
                where: whereClause,
            })

            if (!found) return null

            current = found
            parentId = found.id
        }

        if (!current) return null

        // breadcrumbs через blog_category_path
        const pathRows = await db.query.blogCategoryPath.findMany({
            where: eq(blogCategoryPath.categoryId, current.id),
            orderBy: [asc(blogCategoryPath.level)],
            with: {
                path: {
                    columns: { id: true, name: true, slug: true },
                },
            },
        })

        const breadcrumbs = pathRows.map((r) => ({
            id: r.path.id,
            name: r.path.name,
            slug: r.path.slug,
        }))

        return {
            id: current.id,
            name: current.name,
            slug: current.slug,
            description: current.description,
            metaTitle: current.metaTitle,
            metaDescription: current.metaDescription,
            metaH1: current.metaH1,
            breadcrumbs,
        }
    }
)

// ============================================================
// Статьи в категории (включая подкатегории)
// ============================================================

export type ArticleSort =
    | "newest"
    | "viewed"
    | "title_asc"
    | "title_desc"
    | "sort_order"

export type ArticlesQuery = {
    categoryId: number | null
    sort?: ArticleSort
    limit?: number
    page?: number
}

export type ArticlesResult = {
    articles: CatalogArticle[]
    total: number
    page: number
    limit: number
    totalPages: number
}

const DEFAULT_LIMIT = 12
const DEFAULT_SORT: ArticleSort = "newest"

export const getArticlesByCategoryId = cache(
    async ({
               categoryId,
               sort = DEFAULT_SORT,
               limit = DEFAULT_LIMIT,
               page = 1,
           }: ArticlesQuery): Promise<ArticlesResult> => {
        const safeLimit = [12, 24, 48].includes(limit) ? limit : DEFAULT_LIMIT
        const safePage = Math.max(1, page)
        const offset = (safePage - 1) * safeLimit

        const orderBy = (() => {
            switch (sort) {
                case "title_asc":
                    return [asc(articles.title)]
                case "title_desc":
                    return [desc(articles.title)]
                case "viewed":
                    return [desc(articles.viewed)]
                case "sort_order":
                    return [asc(articles.sortOrder)]
                case "newest":
                default:
                    return [desc(articles.publishedAt)]
            }
        })()

        // только опубликованные
        const baseWhere = and(
            eq(articles.status, true),
            sql`${articles.publishedAt} IS NOT NULL`
        )

        // --- без категории (все) ---
        if (categoryId === null) {
            const totalResult = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(articles)
                .where(baseWhere)

            const total = totalResult[0]?.count ?? 0

            const rows = await db.query.articles.findMany({
                where: baseWhere,
                orderBy,
                limit: safeLimit,
                offset,
                columns: {
                    id: true,
                    title: true,
                    slug: true,
                    excerpt: true,
                    image: true,
                    publishedAt: true,
                    viewed: true,
                },
            })

            return {
                articles: rows,
                total,
                page: safePage,
                limit: safeLimit,
                totalPages: Math.max(1, Math.ceil(total / safeLimit)),
            }
        }

        // --- с категорией (включая подкатегории) ---
        const totalResult = await db
            .select({
                count: sql<number>`count(DISTINCT ${articles.id})::int`,
            })
            .from(articles)
            .innerJoin(
                articleToCategory,
                eq(articleToCategory.articleId, articles.id)
            )
            .innerJoin(
                blogCategoryPath,
                eq(blogCategoryPath.categoryId, articleToCategory.categoryId)
            )
            .where(and(eq(blogCategoryPath.pathId, categoryId), baseWhere))

        const total = totalResult[0]?.count ?? 0

        const rows = await db
            .selectDistinctOn([articles.id], {
                id: articles.id,
                title: articles.title,
                slug: articles.slug,
                excerpt: articles.excerpt,
                image: articles.image,
                publishedAt: articles.publishedAt,
                viewed: articles.viewed,
                sortOrder: articles.sortOrder,
            })
            .from(articles)
            .innerJoin(
                articleToCategory,
                eq(articleToCategory.articleId, articles.id)
            )
            .innerJoin(
                blogCategoryPath,
                eq(blogCategoryPath.categoryId, articleToCategory.categoryId)
            )
            .where(and(eq(blogCategoryPath.pathId, categoryId), baseWhere))
            .orderBy(articles.id, ...orderBy)
            .limit(safeLimit)
            .offset(offset)

        // distinctOn + нужная сортировка — досортировываем в JS
        const sorted = [...rows].sort((a, b) => {
            switch (sort) {
                case "title_asc":
                    return a.title.localeCompare(b.title)
                case "title_desc":
                    return b.title.localeCompare(a.title)
                case "viewed":
                    return b.viewed - a.viewed
                case "sort_order":
                    return a.sortOrder - b.sortOrder
                case "newest":
                default:
                    return (
                        (b.publishedAt?.getTime() ?? 0) -
                        (a.publishedAt?.getTime() ?? 0)
                    )
            }
        })

        return {
            articles: sorted.map(({ sortOrder, ...rest }) => rest),
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        }
    }
)