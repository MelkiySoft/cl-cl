"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type CatalogPaginationProps = {
    page: number
    totalPages: number
}

export function CatalogPagination({ page, totalPages }: CatalogPaginationProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    if (totalPages <= 1) return null

    function buildHref(p: number) {
        const params = new URLSearchParams(searchParams.toString())
        if (p <= 1) {
            params.delete("page")
        } else {
            params.set("page", String(p))
        }
        const qs = params.toString()
        return qs ? `${pathname}?${qs}` : pathname
    }

    // показываем окно страниц
    const pages: number[] = []
    const window = 2
    for (let i = Math.max(1, page - window); i <= Math.min(totalPages, page + window); i++) {
        pages.push(i)
    }

    return (
        <nav className="mt-10 flex items-center justify-center gap-1">
            {/* Prev */}
            {page > 1 ? (
                <Link
                    href={buildHref(page - 1)}
                    className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-9")}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="size-4" />
                </Link>
            ) : (
                <span
                    className={cn(
                        buttonVariants({ variant: "outline", size: "icon" }),
                        "size-9 pointer-events-none opacity-40"
                    )}
                >
          <ChevronLeft className="size-4" />
        </span>
            )}

            {/* First page + ellipsis */}
            {pages[0] > 1 && (
                <>
                    <Link
                        href={buildHref(1)}
                        className={cn(
                            buttonVariants({ variant: "outline", size: "icon" }),
                            "size-9"
                        )}
                    >
                        1
                    </Link>
                    {pages[0] > 2 && (
                        <span className="px-1 text-muted-foreground">…</span>
                    )}
                </>
            )}

            {/* Page numbers */}
            {pages.map((p) => (
                <Link
                    key={p}
                    href={buildHref(p)}
                    className={cn(
                        buttonVariants({
                            variant: p === page ? "default" : "outline",
                            size: "icon",
                        }),
                        "size-9"
                    )}
                >
                    {p}
                </Link>
            ))}

            {/* Last page + ellipsis */}
            {pages[pages.length - 1] < totalPages && (
                <>
                    {pages[pages.length - 1] < totalPages - 1 && (
                        <span className="px-1 text-muted-foreground">…</span>
                    )}
                    <Link
                        href={buildHref(totalPages)}
                        className={cn(
                            buttonVariants({ variant: "outline", size: "icon" }),
                            "size-9"
                        )}
                    >
                        {totalPages}
                    </Link>
                </>
            )}

            {/* Next */}
            {page < totalPages ? (
                <Link
                    href={buildHref(page + 1)}
                    className={cn(buttonVariants({ variant: "outline", size: "icon" }), "size-9")}
                    aria-label="Next page"
                >
                    <ChevronRight className="size-4" />
                </Link>
            ) : (
                <span
                    className={cn(
                        buttonVariants({ variant: "outline", size: "icon" }),
                        "size-9 pointer-events-none opacity-40"
                    )}
                >
          <ChevronRight className="size-4" />
        </span>
            )}
        </nav>
    )
}