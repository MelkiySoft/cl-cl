import { ArticleCard } from "./article-card"
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