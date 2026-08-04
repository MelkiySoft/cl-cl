import { cache } from "react"
import { eq, isNull, asc, and } from "drizzle-orm"

import { db } from "@/db"
import { categories } from "@/db/schema"

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