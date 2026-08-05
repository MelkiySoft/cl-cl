"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import type { BlogCategoryNode } from "@/lib/blog-categories"

type BlogCategorySidebarProps = {
    tree: BlogCategoryNode[]
    currentSlug?: string
}

function CategoryItem({
                          node,
                          depth = 0,
                          currentSlug,
                          parentPath = "",
                      }: {
    node: BlogCategoryNode
    depth?: number
    currentSlug?: string
    parentPath?: string
}) {
    const path = parentPath ? `${parentPath}/${node.slug}` : node.slug
    const href = `/blog/${path}`
    const isActive = currentSlug === node.slug
    const hasChildren = node.children.length > 0

    return (
        <div>
            <Link
                href={href}
                className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                style={{ paddingLeft: `${0.625 + depth * 0.75}rem` }}
            >
                {hasChildren && (
                    <ChevronRight className="size-3.5 shrink-0 opacity-50" />
                )}
                <span className={cn(!hasChildren && "ml-5")}>{node.name}</span>
            </Link>

            {hasChildren && (
                <div className="mt-0.5">
                    {node.children.map((child) => (
                        <CategoryItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            currentSlug={currentSlug}
                            parentPath={path}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function BlogCategorySidebar({
                                        tree,
                                        currentSlug,
                                    }: BlogCategorySidebarProps) {
    return (
        <aside className="w-full lg:w-56 shrink-0">
            <div className="sticky top-20 space-y-1">
                <p className="px-2.5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Categories
                </p>

                <Link
                    href="/blog"
                    className={cn(
                        "flex items-center rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        !currentSlug
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                >
                    All articles
                </Link>

                <div className="mt-1 space-y-0.5">
                    {tree.map((node) => (
                        <CategoryItem
                            key={node.id}
                            node={node}
                            currentSlug={currentSlug}
                        />
                    ))}
                </div>
            </div>
        </aside>
    )
}