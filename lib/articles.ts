import { cache } from "react"
import { eq, and, asc } from "drizzle-orm"

import { db } from "@/db"
import {
    articles,
    articleToCategory,
    blogCategories,
    users,
} from "@/db/schema"

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