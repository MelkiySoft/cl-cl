import { Suspense } from "react"

import { getCompaniesByCategoryId } from "@/lib/categories"
import {
    parseCatalogSearchParams,
    type CatalogSearchParams,
} from "@/lib/catalog-path"
import {
    EMPTY_FILTERS,
    type CatalogFilters,
} from "@/lib/catalog-filters"
import { CatalogToolbar } from "@/components/site/catalog/catalog-toolbar"
import { CatalogPagination } from "@/components/site/catalog/catalog-pagination"
import { CompanyGrid } from "@/components/site/catalog/company-grid"

type CatalogListingProps = {
    searchParams: Promise<CatalogSearchParams>
    categoryId: number | null
    cityId?: number | null
    sCity: string | null
    filters?: CatalogFilters
}

export async function CatalogListing({
                                         searchParams,
                                         categoryId,
                                         cityId,
                                         sCity,
                                         filters = EMPTY_FILTERS,
                                     }: CatalogListingProps) {
    const { sort, limit, page } = parseCatalogSearchParams(await searchParams)

    const { companies, total, totalPages } = await getCompaniesByCategoryId({
        categoryId,
        cityId,
        sCity,
        filters,
        sort,
        limit,
        page,
    })

    return (
        <>
            <Suspense fallback={null}>
                <CatalogToolbar total={total} />
            </Suspense>

            <CompanyGrid companies={companies} />

            <Suspense fallback={null}>
                <CatalogPagination page={page} totalPages={totalPages} />
            </Suspense>
        </>
    )
}

export function CatalogListingFallback() {
    return (
        <div className="space-y-5">
            <div className="h-9 w-full max-w-sm rounded-md bg-muted/60" />
            <div className="grid grid-cols-1 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-32 rounded-xl border bg-muted/40"
                    />
                ))}
            </div>
        </div>
    )
}
