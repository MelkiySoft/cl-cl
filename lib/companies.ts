import { cache } from "react"
import { eq, and, asc, inArray } from "drizzle-orm"
import { db } from "@/db"
import {
    companies,
    companyImages,
    companyToCategory,
    categories,
    categoryPath,
} from "@/db/schema"
import type { CatalogCompany } from "@/lib/categories"

export type CompanyDetail = {
    id: number
    name: string
    slug: string
    legalName: string
    dbaName: string | null
    description: string | null
    metaTitle: string | null
    metaDescription: string | null
    metaH1: string | null
    image: string | null
    phone: string | null
    email: string | null
    website: string | null
    yearFounded: number | null
    employeesCount: number | null
    businessStructure: string | null
    isInsured: boolean
    isBonded: boolean
    isLicensed: boolean
    addressLine1: string | null
    addressLine2: string | null
    city: string | null
    state: string | null
    zip: string | null
    country: string
    latitude: string | null
    longitude: string | null
    viewed: number
    images: { id: number; image: string; sortOrder: number }[]
    categories: {
        id: number
        name: string
        slug: string
        isMain: boolean
        path: { id: number; name: string; slug: string }[]
    }[]
}

export const getCompanyBySlug = cache(
    async (slug: string): Promise<CompanyDetail | null> => {
        const company = await db.query.companies.findFirst({
            where: and(
                eq(companies.slug, slug),
                eq(companies.status, true),
                eq(companies.moderationStatus, "approved")
            ),
            with: {
                images: {
                    orderBy: [asc(companyImages.sortOrder)],
                    columns: {
                        id: true,
                        image: true,
                        sortOrder: true,
                    },
                },
                categories: {
                    columns: {
                        isMain: true,
                    },
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

        if (!company) return null

        const links = (company.categories ?? []).filter(
            (link) => link.category && link.category.status
        )

        const categoryIds = links.map((link) => link.category.id)

// Полные пути для всех категорий компании
        const pathRows =
            categoryIds.length > 0
                ? await db.query.categoryPath.findMany({
                    where: inArray(categoryPath.categoryId, categoryIds),
                    with: {
                        path: {
                            columns: {
                                id: true,
                                name: true,
                                slug: true,
                            },
                        },
                    },
                    orderBy: [asc(categoryPath.level)],
                })
                : []

        const pathByCategoryId = new Map<
            number,
            { id: number; name: string; slug: string }[]
        >()

        for (const row of pathRows) {
            if (!row.path) continue
            const list = pathByCategoryId.get(row.categoryId) ?? []
            list.push({
                id: row.path.id,
                name: row.path.name,
                slug: row.path.slug,
            })
            pathByCategoryId.set(row.categoryId, list)
        }

        const cats = links.map((link) => ({
            id: link.category.id,
            name: link.category.name,
            slug: link.category.slug,
            isMain: link.isMain,
            path: pathByCategoryId.get(link.category.id) ?? [
                {
                    id: link.category.id,
                    name: link.category.name,
                    slug: link.category.slug,
                },
            ],
        }))

        return {
            id: company.id,
            name: company.name,
            slug: company.slug,
            legalName: company.legalName,
            dbaName: company.dbaName,
            description: company.description,
            metaTitle: company.metaTitle,
            metaDescription: company.metaDescription,
            metaH1: company.metaH1,
            image: company.image,
            phone: company.phone,
            email: company.email,
            website: company.website,
            yearFounded: company.yearFounded,
            employeesCount: company.employeesCount,
            businessStructure: company.businessStructure,
            isInsured: company.isInsured,
            isBonded: company.isBonded,
            isLicensed: company.isLicensed,
            addressLine1: company.addressLine1,
            addressLine2: company.addressLine2,
            city: company.city,
            state: company.state,
            zip: company.zip,
            country: company.country,
            latitude: company.latitude,
            longitude: company.longitude,
            viewed: company.viewed,
            images: company.images ?? [],
            categories: cats,
        }
    }
)

/**
 * Получить компании по списку id (только approved + status=true).
 * Порядок возвращаемых компаний соответствует порядку переданных id.
 */
export const getCompaniesByIds = cache(
    async (ids: number[]): Promise<CatalogCompany[]> => {
        if (!ids.length) return []

        const uniqueIds = [...new Set(ids)]

        const rows = await db.query.companies.findMany({
            where: and(
                inArray(companies.id, uniqueIds),
                eq(companies.status, true),
                eq(companies.moderationStatus, "approved")
            ),
            columns: {
                id: true,
                name: true,
                slug: true,
                description: true,
                image: true,
                city: true,
                state: true,
                isInsured: true,
                isBonded: true,
                isLicensed: true,
                viewed: true,
            },
        })

        // Сохраняем порядок, который указал пользователь
        const map = new Map(rows.map((c) => [c.id, c]))
        return ids
            .map((id) => map.get(id))
            .filter((c): c is CatalogCompany => Boolean(c))
    }
)