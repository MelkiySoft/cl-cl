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
    /** сохраняем активные фильтры при смене категории */
    filterTokens?: string[]
}

function CategoryItem({
                          node,
                          depth = 0,
                          currentSlug,
                          citySlug,
                          filterTokens,
                          parentSlugs = [],
                      }: {
    node: CategoryNode
    depth?: number
    currentSlug?: string
    citySlug?: string | null
    filterTokens?: string[]
    parentSlugs?: string[]
}) {
    const categorySlugs = [...parentSlugs, node.slug]
    const href = buildCatalogPath({
        citySlug,
        categorySlugs,
        filterTokens,
    })
    const isActive = currentSlug === node.slug
    const hasChildren = node.children.length > 0

    return (
        <div>
            <AppLink
                href={href}
                className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-lg transition-colors",
                    isActive
                        ? "bg-accent text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-primary"
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
                            filterTokens={filterTokens}
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
                                    filterTokens,
                                }: CategorySidebarProps) {
    return (
        <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-20 space-y-1">
                <p className="px-2.5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Categories
                </p>

                <AppLink
                    href={buildCatalogPath({ citySlug, filterTokens })}
                    className={cn(
                        "flex items-center rounded-md px-2.5 py-1.5 text-lg transition-colors",
                        !currentSlug
                            ? "bg-accent text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-primary"
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
                            filterTokens={filterTokens}
                        />
                    ))}
                </div>
            </div>
        </aside>
    )
}
