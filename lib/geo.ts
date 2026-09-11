import { cache } from "react"
import { and, eq, inArray, sql } from "drizzle-orm"

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

export type GeoCitySuggestion = {
    city: string
    stateId: string
    label: string
}

export type GeoZipSuggestion = {
    zip: string
    city: string
    stateId: string
    label: string
}

export function normalizeZip(zip: string | null | undefined): string | null {
    if (!zip) return null
    const digits = zip.replace(/\D/g, "")
    if (digits.length < 5) return null
    return digits.slice(0, 5)
}

export function formatServiceCityLabel(city: string, stateId: string): string {
    return `${city.trim()} ${stateId.trim().toUpperCase()}`
}

export function parseServiceCityLabel(
    label: string | null | undefined
): { city: string; stateId: string } | null {
    if (!label) return null
    const match = label.trim().match(/^(.*)\s+([A-Za-z]{2})$/)
    if (!match) return null
    const city = match[1].trim()
    const stateId = match[2].toUpperCase()
    if (!city || stateId.length !== 2) return null
    return { city, stateId }
}

function likeContains(value: string): string {
    return `%${value.replace(/[%_\\]/g, "\\$&")}%`
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

const publicCityFilter = inArray(geoUsa.slug, [...PUBLIC_CITY_SLUGS])

export async function searchGeoCities(
    query: string,
    limit = 20
): Promise<GeoCitySuggestion[]> {
    const q = query.trim()

    const filters = [eq(geoUsa.isActive, true), publicCityFilter]
    if (q.length >= 1) {
        filters.push(sql`${geoUsa.city} ilike ${likeContains(q)}`)
    }

    const rows = await db
        .selectDistinct({
            city: geoUsa.city,
            stateId: geoUsa.stateId,
        })
        .from(geoUsa)
        .where(and(...filters))
        .limit(limit)

    return rows
        .filter((row): row is { city: string; stateId: string } =>
            Boolean(row.city && row.stateId)
        )
        .map((row) => ({
            city: row.city,
            stateId: row.stateId,
            label: formatServiceCityLabel(row.city, row.stateId),
        }))
}

export async function searchGeoZips(opts: {
    query?: string
    city?: string
    stateId?: string
    limit?: number
}): Promise<GeoZipSuggestion[]> {
    const limit = opts.limit ?? 20
    const zipPrefix = opts.query?.replace(/\D/g, "") ?? ""

    const filters = [eq(geoUsa.isActive, true), publicCityFilter]

    if (opts.city) filters.push(eq(geoUsa.city, opts.city))
    if (opts.stateId) filters.push(eq(geoUsa.stateId, opts.stateId))
    if (zipPrefix) {
        filters.push(sql`${geoUsa.zip} like ${`${zipPrefix}%`}`)
    }

    const rows = await db
        .select({
            zip: geoUsa.zip,
            city: geoUsa.city,
            stateId: geoUsa.stateId,
        })
        .from(geoUsa)
        .where(and(...filters))
        .limit(limit)

    return rows
        .filter((row): row is { zip: string; city: string; stateId: string } =>
            Boolean(row.zip && row.city && row.stateId)
        )
        .map((row) => ({
            zip: row.zip,
            city: row.city,
            stateId: row.stateId,
            label: `${row.zip} — ${formatServiceCityLabel(row.city, row.stateId)}`,
        }))
}

export async function getGeoCityByExactLabel(label: string) {
    const parsed = parseServiceCityLabel(label)
    if (!parsed) return null

    const row = await db.query.geoUsa.findFirst({
        where: and(
            eq(geoUsa.city, parsed.city),
            eq(geoUsa.stateId, parsed.stateId),
            eq(geoUsa.isActive, true),
            publicCityFilter
        ),
        columns: {
            city: true,
            stateId: true,
            slug: true,
        },
    })

    if (!row?.city || !row.stateId || !row.slug || !isPublicCitySlug(row.slug)) {
        return null
    }

    return {
        city: row.city,
        stateId: row.stateId,
        label: formatServiceCityLabel(row.city, row.stateId),
    }
}

export async function getCoordsByServiceCity(sCity: string): Promise<{
    latitude: string
    longitude: string
} | null> {
    const parsed = parseServiceCityLabel(sCity)
    if (!parsed) return null

    const row = await db.query.geoUsa.findFirst({
        where: and(
            eq(geoUsa.city, parsed.city),
            eq(geoUsa.stateId, parsed.stateId),
            eq(geoUsa.isActive, true)
        ),
        columns: {
            cityLat: true,
            cityLng: true,
            zctaLat: true,
            zctaLng: true,
        },
    })

    if (!row) return null

    const latitude = String(row.cityLat ?? row.zctaLat ?? "")
    const longitude = String(row.cityLng ?? row.zctaLng ?? "")
    if (!latitude || !longitude) return null

    return { latitude, longitude }
}

export { PUBLIC_CITY_SLUGS, SSG_CITY_SLUGS }

export type ZipMapPoint = {
    zip: string
    latitude: string
    longitude: string
}

export async function getCoordsByZips(
    zips: string[]
): Promise<ZipMapPoint[]> {
    const normalized = [
        ...new Set(
            zips
                .map((zip) => normalizeZip(zip))
                .filter((zip): zip is string => Boolean(zip))
        ),
    ]
    if (normalized.length === 0) return []

    const rows = await db
        .select({
            zip: geoUsa.zip,
            zctaLat: geoUsa.zctaLat,
            zctaLng: geoUsa.zctaLng,
            cityLat: geoUsa.cityLat,
            cityLng: geoUsa.cityLng,
        })
        .from(geoUsa)
        .where(and(inArray(geoUsa.zip, normalized), eq(geoUsa.isActive, true)))

    const byZip = new Map<string, ZipMapPoint>()
    for (const row of rows) {
        if (!row.zip || byZip.has(row.zip)) continue
        const latitude = String(row.zctaLat ?? row.cityLat ?? "")
        const longitude = String(row.zctaLng ?? row.cityLng ?? "")
        if (!latitude || !longitude) continue
        byZip.set(row.zip, { zip: row.zip, latitude, longitude })
    }

    return normalized
        .map((zip) => byZip.get(zip))
        .filter((point): point is ZipMapPoint => Boolean(point))
}
