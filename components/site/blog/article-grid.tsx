import Link from "next/link"
import Image from "next/image"
import type { CatalogArticle } from "@/lib/blog-categories"

type ArticleGridProps = {
    articles: CatalogArticle[]
}

export function ArticleGrid({ articles }: ArticleGridProps) {
    if (articles.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                No articles found in this category yet.
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {articles.map((article, index) => (
                <ArticleCard
                    key={article.id}
                    article={article}
                    priority={index < 3}
                />
            ))}
        </div>
    )
}

function ArticleCard({
                         article,
                         priority = false,
                     }: {
    article: CatalogArticle
    priority?: boolean
}) {
    const date = article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        : null

    return (
        <Link
            href={`/article/${article.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/40"
        >
            <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                {article.image ? (
                    <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        priority={priority}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                        No image
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-4">
                {date && (
                    <time className="text-xs text-muted-foreground mb-1.5">
                        {date}
                    </time>
                )}
                <h2 className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                </h2>
                {article.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {article.excerpt}
                    </p>
                )}
            </div>
        </Link>
    )
}