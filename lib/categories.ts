import { cache } from "react"
import { eq, isNull, asc, desc, and, sql } from "drizzle-orm"
import type { SQL } from "drizzle-orm"

import { db } from "@/db"
import {
    categories,
    categoryPath,
    companies,
    companyToCategory,
    companyImages,
} from "@/db/schema"

export type MenuCategoryChild = {
    id: number
    name: string
    slug: string
}

export type MenuCategory = {
    id: number
    name: string
    slug: string
    children: MenuCategoryChild[]
}

/**
 * Категории для меню (header + mobile).
 * Берём корневые (parentId = null) + их прямых детей.
 * Только status = true, сортировка по sortOrder.
 */
export const getMenuCategories = cache(async (): Promise<MenuCategory[]> => {
    const roots = await db.query.categories.findMany({
        where: and(isNull(categories.parentId), eq(categories.status, true)),
        orderBy: [asc(categories.sortOrder)],
        with: {
            children: {
                where: eq(categories.status, true),
                orderBy: [asc(categories.sortOrder)],
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
})

// ============================================================
// Типы для страницы каталога
// ============================================================

export type CategoryNode = {
    id: number
    name: string
    slug: string
    parentId: number | null
    children: CategoryNode[]
}

export type CatalogCompany = {
    id: number
    name: string
    slug: string
    description: string | null
    image: string | null
    city: string | null
    state: string | null
    isInsured: boolean
    isBonded: boolean
    isLicensed: boolean
    viewed: number
}

export type CategoryWithPath = {
    id: number
    name: string
    slug: string
    description: string | null
    metaTitle: string | null
    metaDescription: string | null
    metaH1: string | null
    // полный путь от корня до текущей (для хлебных крошек)
    breadcrumbs: { id: number; name: string; slug: string }[]
}

// ============================================================
// Дерево категорий для сайдбара
// ============================================================

export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
    const all = await db.query.categories.findMany({
        where: eq(categories.status, true),
        orderBy: [asc(categories.sortOrder)],
        columns: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
        },
    })

    const map = new Map<number, CategoryNode>()
    const roots: CategoryNode[] = []

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
})

// ============================================================
// Найти категорию по пути slug'ов
// ============================================================

export const getCategoryByPath = cache(
    async (slugs: string[]): Promise<CategoryWithPath | null> => {
        if (slugs.length === 0) return null

        let parentId: number | null = null
        let current: typeof categories.$inferSelect | null = null

        for (const slug of slugs) {
            let whereClause: SQL | undefined

            if (parentId === null) {
                whereClause = and(
                    eq(categories.slug, slug),
                    eq(categories.status, true),
                    isNull(categories.parentId)
                )
            } else {
                whereClause = and(
                    eq(categories.slug, slug),
                    eq(categories.status, true),
                    eq(categories.parentId, parentId)
                )
            }

            const found: typeof categories.$inferSelect | undefined =
                await db.query.categories.findFirst({
                    where: whereClause,
                })

            if (!found) return null

            current = found
            parentId = found.id
        }

        if (!current) return null

        // breadcrumbs через category_path
        const pathRows = await db.query.categoryPath.findMany({
            where: eq(categoryPath.categoryId, current.id),
            orderBy: [asc(categoryPath.level)],
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
// Компании в категории (включая подкатегории)
// ============================================================

export type CompanySort =
    | "sort_order"
    | "name_asc"
    | "name_desc"
    | "newest"
    | "viewed"

export type CompaniesQuery = {
    categoryId: number | null
    sort?: CompanySort
    limit?: number
    page?: number
}

export type CompaniesResult = {
    companies: CatalogCompany[]
    total: number
    page: number
    limit: number
    totalPages: number
}

const DEFAULT_LIMIT = 15
const DEFAULT_SORT: CompanySort = "sort_order"

export const getCompaniesByCategoryId = cache(
    async ({
               categoryId,
               sort = DEFAULT_SORT,
               limit = DEFAULT_LIMIT,
               page = 1,
           }: CompaniesQuery): Promise<CompaniesResult> => {
        const safeLimit = [15, 30, 60, 120].includes(limit) ? limit : DEFAULT_LIMIT
        const safePage = Math.max(1, page)
        const offset = (safePage - 1) * safeLimit

        // порядок сортировки
        const orderBy = (() => {
            switch (sort) {
                case "name_asc":
                    return [asc(companies.name)]
                case "name_desc":
                    return [desc(companies.name)]
                case "newest":
                    return [desc(companies.createdAt)]
                case "viewed":
                    return [desc(companies.viewed)]
                case "sort_order":
                default:
                    return [asc(companies.sortOrder)]
            }
        })()

        const baseWhere = and(
            eq(companies.status, true),
            eq(companies.moderationStatus, "approved")
        )

        // --- без категории (все) ---
        if (categoryId === null) {
            const totalResult = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(companies)
                .where(baseWhere)

            const total = totalResult[0]?.count ?? 0

            const rows = await db.query.companies.findMany({
                where: baseWhere,
                orderBy,
                limit: safeLimit,
                offset,
                columns: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    image: true,
                    city: true,
                    state: true,
                    isInsured: true,
                    isBonded: true,
                    isLicensed: true,
                    viewed: true,
                },
            })

            return {
                companies: rows,
                total,
                page: safePage,
                limit: safeLimit,
                totalPages: Math.max(1, Math.ceil(total / safeLimit)),
            }
        }

        // --- с категорией (включая подкатегории) ---
        const totalResult = await db
            .select({ count: sql<number>`count(DISTINCT ${companies.id})::int` })
            .from(companies)
            .innerJoin(
                companyToCategory,
                eq(companyToCategory.companyId, companies.id)
            )
            .innerJoin(
                categoryPath,
                eq(categoryPath.categoryId, companyToCategory.categoryId)
            )
            .where(and(eq(categoryPath.pathId, categoryId), baseWhere))

        const total = totalResult[0]?.count ?? 0

        const rows = await db
            .selectDistinctOn([companies.id], {
                id: companies.id,
                name: companies.name,
                slug: companies.slug,
                description: companies.description,
                image: companies.image,
                city: companies.city,
                state: companies.state,
                isInsured: companies.isInsured,
                isBonded: companies.isBonded,
                isLicensed: companies.isLicensed,
                viewed: companies.viewed,
                sortOrder: companies.sortOrder,
                createdAt: companies.createdAt,
            })
            .from(companies)
            .innerJoin(
                companyToCategory,
                eq(companyToCategory.companyId, companies.id)
            )
            .innerJoin(
                categoryPath,
                eq(categoryPath.categoryId, companyToCategory.categoryId)
            )
            .where(and(eq(categoryPath.pathId, categoryId), baseWhere))
            .orderBy(companies.id, ...orderBy) // distinctOn требует первый orderBy = distinct колонке
            .limit(safeLimit)
            .offset(offset)

        // distinctOn + нужная сортировка — после выборки сортируем в JS
        // (для 15–120 записей это нормально)
        const sorted = [...rows].sort((a, b) => {
            switch (sort) {
                case "name_asc":
                    return a.name.localeCompare(b.name)
                case "name_desc":
                    return b.name.localeCompare(a.name)
                case "newest":
                    return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
                case "viewed":
                    return b.viewed - a.viewed
                default:
                    return a.sortOrder - b.sortOrder
            }
        })

        return {
            companies: sorted.map(({ sortOrder, createdAt, ...rest }) => rest),
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        }
    }
)