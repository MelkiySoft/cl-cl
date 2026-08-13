import { cache } from "react"
import { eq, and, inArray } from "drizzle-orm"

import { db } from "@/db"
import { articles } from "@/db/schema"
import type { CatalogArticle } from "@/lib/blog-categories"

export type ArticleDetail = {
    id: number
    title: string
    slug: string
    excerpt: string | null
    content: string | null
    image: string | null
    metaTitle: string | null
    metaDescription: string | null
    metaH1: string | null
    publishedAt: Date | null
    viewed: number
    author: {
        id: string
        name: string | null
        image: string | null
    } | null
    categories: { id: number; name: string; slug: string }[]
}

export const getArticleBySlug = cache(
    async (slug: string): Promise<ArticleDetail | null> => {
        const article = await db.query.articles.findFirst({
            where: and(
                eq(articles.slug, slug),
                eq(articles.status, true)
                // publishedAt проверяем отдельно, если нужно строго
            ),
            with: {
                author: {
                    columns: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                categories: {
                    with: {
                        category: {
                            columns: {
                                id: true,
                                name: true,
                                slug: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        })

        if (!article) return null

        // дополнительно можно проверять publishedAt
        if (!article.publishedAt) return null

        const cats = (article.categories ?? [])
            .map((link) => link.category)
            .filter((c) => c && c.status)
            .map((c) => ({
                id: c.id,
                name: c.name,
                slug: c.slug,
            }))

        return {
            id: article.id,
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            content: article.content,
            image: article.image,
            metaTitle: article.metaTitle,
            metaDescription: article.metaDescription,
            metaH1: article.metaH1,
            publishedAt: article.publishedAt,
            viewed: article.viewed,
            author: article.author
                ? {
                    id: article.author.id,
                    name: article.author.name,
                    image: article.author.image,
                }
                : null,
            categories: cats,
        }
    }
)

/**
 * Получить статьи по списку id (только опубликованные).
 * Порядок возвращаемых статей соответствует порядку переданных id.
 */
export const getArticlesByIds = cache(
    async (ids: number[]): Promise<CatalogArticle[]> => {
        if (!ids.length) return []

        const uniqueIds = [...new Set(ids)]

        const rows = await db.query.articles.findMany({
            where: and(
                inArray(articles.id, uniqueIds),
                eq(articles.status, true)
            ),
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

        // Оставляем только те, у которых есть дата публикации
        const published = rows.filter((a) => a.publishedAt !== null)

        const map = new Map(published.map((a) => [a.id, a]))
        return ids
            .map((id) => map.get(id))
            .filter((a): a is CatalogArticle => Boolean(a))
    }
)