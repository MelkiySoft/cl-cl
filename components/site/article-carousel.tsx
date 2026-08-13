import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { ArticleCard } from "@/components/site/blog/article-card"
import { getArticlesByIds } from "@/lib/articles"
import { cn } from "@/lib/utils"

type ArticleCarouselProps = {
    title: string
    articleIds: number[]
    className?: string
}

export async function ArticleCarousel({
                                          title,
                                          articleIds,
                                          className,
                                      }: ArticleCarouselProps) {
    const articles = await getArticlesByIds(articleIds)

    if (articles.length === 0) return null

    return (
        <section className={cn("space-y-5", className)}>
            {title && (
                <div className="flex items-end justify-between gap-4">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        {title}
                    </h2>
                </div>
            )}

            <Carousel
                opts={{
                    align: "start",
                    loop: articles.length > 3,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-4 py-3">
                    {articles.map((article, index) => (
                        <CarouselItem
                            key={article.id}
                            className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                        >
                            <div className="h-full p-px">
                                <ArticleCard
                                    article={article}
                                    priority={index < 2}
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                <CarouselPrevious className="-left-3 md:-left-5" />
                <CarouselNext className="-right-3 md:-right-5" />
            </Carousel>
        </section>
    )
}