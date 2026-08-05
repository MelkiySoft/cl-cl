import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Calendar, Eye, User } from "lucide-react"

import { getArticleBySlug } from "@/lib/articles"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type PageProps = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({
                                           params,
                                       }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const article = await getArticleBySlug(slug)

    if (!article) {
        return { title: "Article not found" }
    }

    return {
        title: article.metaTitle || article.title,
        description:
            article.metaDescription ||
            article.excerpt ||
            `Read ${article.title}`,
    }
}

export default async function ArticlePage({ params }: PageProps) {
    const { slug } = await params
    const article = await getArticleBySlug(slug)

    if (!article) {
        notFound()
    }

    const title = article.metaH1 || article.title
    const published = article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : null

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            {/* Breadcrumbs */}
            <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                    Home
                </Link>
                <span>/</span>
                <Link
                    href="/blog"
                    className="hover:text-foreground transition-colors"
                >
                    Blog
                </Link>
                {article.categories[0] && (
                    <>
                        <span>/</span>
                        <Link
                            href={`/blog/${article.categories[0].slug}`}
                            className="hover:text-foreground transition-colors"
                        >
                            {article.categories[0].name}
                        </Link>
                    </>
                )}
                <span>/</span>
                <span className="text-foreground font-medium line-clamp-1">
                    {article.title}
                </span>
            </nav>

            <article className="max-w-3xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                        {title}
                    </h1>

                    {article.excerpt && (
                        <p className="mt-4 text-lg text-muted-foreground">
                            {article.excerpt}
                        </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        {article.author?.name && (
                            <span className="flex items-center gap-1.5">
                                <User className="size-4" />
                                {article.author.name}
                            </span>
                        )}
                        {published && (
                            <span className="flex items-center gap-1.5">
                                <Calendar className="size-4" />
                                {published}
                            </span>
                        )}
                        {article.viewed > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Eye className="size-4" />
                                {article.viewed} views
                            </span>
                        )}
                    </div>
                </header>

                {/* Cover image */}
                {article.image && (
                    <div className="relative aspect-[16/9] mb-8 overflow-hidden rounded-xl bg-muted">
                        <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 768px"
                        />
                    </div>
                )}

                {/* Content */}
                {article.content && (
                    <div className="prose prose-neutral dark:prose-invert max-w-none">
                        <div className="whitespace-pre-line leading-relaxed text-foreground/90">
                            {article.content}
                        </div>
                    </div>
                )}

                {/* Categories */}
                {article.categories.length > 0 && (
                    <>
                        <Separator className="my-10" />
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                Categories
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {article.categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/blog/${cat.slug}`}
                                        className="rounded-full border px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </article>
        </div>
    )
}
