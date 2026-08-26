"use client"

import { AppLink } from "@/components/ui/app-link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { buildCatalogPath } from "@/lib/catalog-path"
import type { CategoryNode } from "@/lib/categories"

type CategorySidebarProps = {
    tree: CategoryNode[]
    currentSlug?: string
    citySlug?: string | null
}

function CategoryItem({
                          node,
                          depth = 0,
                          currentSlug,
                          citySlug,
                          parentSlugs = [],
                      }: {
    node: CategoryNode
    depth?: number
    currentSlug?: string
    citySlug?: string | null
    parentSlugs?: string[]
}) {
    const categorySlugs = [...parentSlugs, node.slug]
    const href = buildCatalogPath({ citySlug, categorySlugs })
    const isActive = currentSlug === node.slug
    const hasChildren = node.children.length > 0

    return (
        <div>
            <AppLink
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
            </AppLink>

            {hasChildren && (
                <div className="mt-0.5">
                    {node.children.map((child) => (
                        <CategoryItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            currentSlug={currentSlug}
                            citySlug={citySlug}
                            parentSlugs={categorySlugs}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function CategorySidebar({
                                    tree,
                                    currentSlug,
                                    citySlug,
                                }: CategorySidebarProps) {
    return (
        <aside className="w-full lg:w-56 shrink-0">
            <div className="sticky top-20 space-y-1">
                <p className="px-2.5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Categories
                </p>

                <AppLink
                    href={buildCatalogPath({ citySlug })}
                    className={cn(
                        "flex items-center rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        !currentSlug
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                >
                    All categories
                </AppLink>

                <div className="mt-1 space-y-0.5">
                    {tree.map((node) => (
                        <CategoryItem
                            key={node.id}
                            node={node}
                            currentSlug={currentSlug}
                            citySlug={citySlug}
                        />
                    ))}
                </div>
            </div>
        </aside>
    )
}