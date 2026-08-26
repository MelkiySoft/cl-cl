import { cache } from "react"
import { and, eq, inArray } from "drizzle-orm"

import { db } from "@/db"
import { geoUsa } from "@/db/schema"
import {
    isPublicCitySlug,
    PUBLIC_CITY_SLUGS,
    SSG_CITY_SLUGS,
    type PublicCitySlug,
} from "@/config/cities"

export type PublicCity = {
    slug: PublicCitySlug
    city: string
    stateId: string
    stateName: string | null
    zips: string[]
}

function normalizeZip(zip: string | null | undefined): string | null {
    if (!zip) return null
    const digits = zip.replace(/\D/g, "")
    if (digits.length < 5) return null
    return digits.slice(0, 5)
}

export const getPublicCityBySlug = cache(
    async (slug: string): Promise<PublicCity | null> => {
        if (!isPublicCitySlug(slug)) return null

        const rows = await db
            .select({
                city: geoUsa.city,
                stateId: geoUsa.stateId,
                stateName: geoUsa.stateName,
                zip: geoUsa.zip,
            })
            .from(geoUsa)
            .where(and(eq(geoUsa.slug, slug), eq(geoUsa.isActive, true)))

        if (rows.length === 0) return null

        const zips = [
            ...new Set(
                rows
                    .map((r) => normalizeZip(r.zip))
                    .filter((z): z is string => z !== null)
            ),
        ]

        const first = rows[0]

        return {
            slug,
            city: first.city ?? slug,
            stateId: first.stateId ?? "",
            stateName: first.stateName,
            zips,
        }
    }
)

export const getSsgCities = cache(async (): Promise<PublicCity[]> => {
    const cities = await Promise.all(
        SSG_CITY_SLUGS.map((slug) => getPublicCityBySlug(slug))
    )
    return cities.filter((c): c is PublicCity => c !== null)
})

export const getPublicCityByZip = cache(
    async (zip: string | null | undefined): Promise<PublicCity | null> => {
        const normalized = normalizeZip(zip)
        if (!normalized) return null

        const row = await db
            .select({ slug: geoUsa.slug })
            .from(geoUsa)
            .where(and(eq(geoUsa.zip, normalized), eq(geoUsa.isActive, true)))
            .limit(1)

        const slug = row[0]?.slug
        if (!slug) return null

        return getPublicCityBySlug(slug)
    }
)

export { PUBLIC_CITY_SLUGS, SSG_CITY_SLUGS }