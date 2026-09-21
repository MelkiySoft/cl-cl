import { cache } from "react"
import { unstable_cache } from "next/cache"
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm"

import { db } from "@/db"
import { cities, cityZips } from "@/db/schema"

export type PublicCity = {
    id: number
    slug: string
    city: string
    stateId: string
    stateName: string | null
    zips: string[]
}

export type CityRecord = {
    id: number
    slug: string
    city: string
    stateId: string
    stateName: string | null
    label: string
    isPublic: boolean
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

export type GeoZipRecord = {
    zip: string
    city: string | null
    stateId: string | null
}

export type ZipMapPoint = {
    zip: string
    latitude: string
    longitude: string
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

function toCityRecord(row: {
    id: number
    slug: string
    name: string
    stateId: string
    stateName: string | null
    isPublic: boolean
}): CityRecord {
    return {
        id: row.id,
        slug: row.slug,
        city: row.name,
        stateId: row.stateId,
        stateName: row.stateName,
        label: formatServiceCityLabel(row.name, row.stateId),
        isPublic: row.isPublic,
    }
}

async function zipsForCity(cityId: number): Promise<string[]> {
    const rows = await db
        .select({ zip: cityZips.zip })
        .from(cityZips)
        .where(eq(cityZips.cityId, cityId))

    return [
        ...new Set(
            rows
                .map((row) => normalizeZip(row.zip))
                .filter((zip): zip is string => zip !== null)
        ),
    ]
}

async function toPublicCity(row: {
    id: number
    slug: string
    name: string
    stateId: string
    stateName: string | null
    isPublic: boolean
}): Promise<PublicCity> {
    return {
        id: row.id,
        slug: row.slug,
        city: row.name,
        stateId: row.stateId,
        stateName: row.stateName,
        zips: await zipsForCity(row.id),
    }
}

export const getPublicCitySlugs = unstable_cache(
    async (): Promise<string[]> => {
        const rows = await db
            .select({ slug: cities.slug })
            .from(cities)
            .where(and(eq(cities.isPublic, true), eq(cities.isActive, true)))
            .orderBy(asc(cities.name))

        return rows.map((row) => row.slug)
    },
    ["public-city-slugs"],
    { revalidate: 60, tags: ["cities"] }
)

export const getPublicCityList = unstable_cache(
    async (): Promise<
        Array<{ slug: string; city: string; stateId: string; label: string }>
    > => {
        const rows = await db
            .select({
                slug: cities.slug,
                name: cities.name,
                stateId: cities.stateId,
            })
            .from(cities)
            .where(and(eq(cities.isPublic, true), eq(cities.isActive, true)))
            .orderBy(desc(cities.population), asc(cities.name))

        return rows.map((row) => ({
            slug: row.slug,
            city: row.name,
            stateId: row.stateId,
            label: `${row.name}, ${row.stateId}`,
        }))
    },
    ["public-city-list"],
    { revalidate: 60, tags: ["cities"] }
)

export const getPublicCityBySlug = cache(
    async (slug: string): Promise<PublicCity | null> => {
        const row = await db.query.cities.findFirst({
            where: and(
                eq(cities.slug, slug),
                eq(cities.isPublic, true),
                eq(cities.isActive, true)
            ),
            columns: {
                id: true,
                slug: true,
                name: true,
                stateId: true,
                stateName: true,
                isPublic: true,
            },
        })
        if (!row) return null
        return toPublicCity(row)
    }
)

export const getSsgCities = cache(async (): Promise<PublicCity[]> => {
    const slugs = await getPublicCitySlugs()
    const list = await Promise.all(slugs.map((slug) => getPublicCityBySlug(slug)))
    return list.filter((city): city is PublicCity => city !== null)
})

export async function getCityById(id: number): Promise<CityRecord | null> {
    const row = await db.query.cities.findFirst({
        where: and(eq(cities.id, id), eq(cities.isActive, true)),
        columns: {
            id: true,
            slug: true,
            name: true,
            stateId: true,
            stateName: true,
            isPublic: true,
        },
    })
    return row ? toCityRecord(row) : null
}

export async function getCityByNameState(
    city: string,
    stateId: string
): Promise<CityRecord | null> {
    const name = city.trim()
    const state = stateId.trim().toUpperCase()
    if (!name || state.length !== 2) return null

    const row = await db.query.cities.findFirst({
        where: and(
            eq(cities.stateId, state),
            sql`lower(${cities.name}) = ${name.toLowerCase()}`,
            eq(cities.isActive, true)
        ),
        columns: {
            id: true,
            slug: true,
            name: true,
            stateId: true,
            stateName: true,
            isPublic: true,
        },
    })
    return row ? toCityRecord(row) : null
}

export async function getCityByExactLabel(
    label: string | null | undefined
): Promise<CityRecord | null> {
    const parsed = parseServiceCityLabel(label)
    if (!parsed) return null
    return getCityByNameState(parsed.city, parsed.stateId)
}

/** Город по ZIP. По умолчанию только is_active. */
export async function getCityByZip(
    zip: string | null | undefined,
    opts?: { activeOnly?: boolean }
): Promise<CityRecord | null> {
    const normalized = normalizeZip(zip)
    if (!normalized) return null

    const filters = [eq(cityZips.zip, normalized)]
    if (opts?.activeOnly !== false) {
        filters.push(eq(cities.isActive, true))
    }

    const row = await db
        .select({
            id: cities.id,
            slug: cities.slug,
            name: cities.name,
            stateId: cities.stateId,
            stateName: cities.stateName,
            isPublic: cities.isPublic,
        })
        .from(cityZips)
        .innerJoin(cities, eq(cities.id, cityZips.cityId))
        .where(and(...filters))
        .limit(1)

    return row[0] ? toCityRecord(row[0]) : null
}

export const getPublicCityByZip = cache(
    async (zip: string | null | undefined): Promise<PublicCity | null> => {
        const city = await getCityByZip(zip)
        if (!city?.isPublic) return null
        return getPublicCityBySlug(city.slug)
    }
)

export const getPublicCityByServiceCity = cache(
    async (sCity: string | null | undefined): Promise<PublicCity | null> => {
        const city = await getCityByExactLabel(sCity)
        if (!city?.isPublic) return null
        return getPublicCityBySlug(city.slug)
    }
)

export async function searchGeoCities(
    query: string,
    limit = 20
): Promise<GeoCitySuggestion[]> {
    const q = query.trim()
    const filters = [eq(cities.isActive, true)]
    if (q.length >= 1) {
        filters.push(ilike(cities.name, likeContains(q)))
    }

    const rows = await db
        .select({
            name: cities.name,
            stateId: cities.stateId,
        })
        .from(cities)
        .where(and(...filters))
        .orderBy(desc(cities.population), asc(cities.name))
        .limit(limit)

    return rows.map((row) => ({
        city: row.name,
        stateId: row.stateId,
        label: formatServiceCityLabel(row.name, row.stateId),
    }))
}

export async function searchGeoZips(opts: {
    query?: string
    city?: string
    stateId?: string
    limit?: number
    publicOnly?: boolean
    activeOnly?: boolean
}): Promise<GeoZipSuggestion[]> {
    const limit = opts.limit ?? 20
    const zipPrefix = opts.query?.replace(/\D/g, "") ?? ""

    const filters = []
    if (opts.activeOnly !== false) filters.push(eq(cities.isActive, true))
    if (opts.publicOnly) filters.push(eq(cities.isPublic, true))
    if (opts.city) {
        filters.push(sql`lower(${cities.name}) = ${opts.city.toLowerCase()}`)
    }
    if (opts.stateId) filters.push(eq(cities.stateId, opts.stateId))
    if (zipPrefix) filters.push(sql`${cityZips.zip} like ${`${zipPrefix}%`}`)

    const rows = await db
        .select({
            zip: cityZips.zip,
            name: cities.name,
            stateId: cities.stateId,
        })
        .from(cityZips)
        .innerJoin(cities, eq(cities.id, cityZips.cityId))
        .where(and(...filters))
        .orderBy(asc(cityZips.zip))
        .limit(limit)

    return rows
        .filter((row): row is { zip: string; name: string; stateId: string } =>
            Boolean(row.zip && row.name && row.stateId)
        )
        .map((row) => ({
            zip: row.zip,
            city: row.name,
            stateId: row.stateId,
            label: `${row.zip} — ${formatServiceCityLabel(row.name, row.stateId)}`,
        }))
}

export async function getGeoCityByExactLabel(label: string) {
    return getCityByExactLabel(label)
}

export async function getGeoZips(
    zips: string[]
): Promise<Map<string, GeoZipRecord>> {
    const normalized = [
        ...new Set(
            zips
                .map((zip) => normalizeZip(zip))
                .filter((zip): zip is string => Boolean(zip))
        ),
    ]
    if (normalized.length === 0) return new Map()

    const rows = await db
        .select({
            zip: cityZips.zip,
            name: cities.name,
            stateId: cities.stateId,
        })
        .from(cityZips)
        .innerJoin(cities, eq(cities.id, cityZips.cityId))
        .where(and(inArray(cityZips.zip, normalized), eq(cities.isActive, true)))

    const map = new Map<string, GeoZipRecord>()
    for (const row of rows) {
        if (!row.zip || map.has(row.zip)) continue
        map.set(row.zip, {
            zip: row.zip,
            city: row.name,
            stateId: row.stateId,
        })
    }
    return map
}

export async function getCoordsByServiceCity(sCity: string): Promise<{
    latitude: string
    longitude: string
} | null> {
    const parsed = parseServiceCityLabel(sCity)
    if (!parsed) return null

    const row = await db.query.cities.findFirst({
        where: and(
            sql`lower(${cities.name}) = ${parsed.city.toLowerCase()}`,
            eq(cities.stateId, parsed.stateId),
            eq(cities.isActive, true)
        ),
        columns: { lat: true, lng: true },
    })
    if (!row) return null

    const latitude = String(row.lat ?? "")
    const longitude = String(row.lng ?? "")
    if (!latitude || !longitude) return null
    return { latitude, longitude }
}

export async function getCoordsByZips(zips: string[]): Promise<ZipMapPoint[]> {
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
            zip: cityZips.zip,
            lat: cityZips.lat,
            lng: cityZips.lng,
        })
        .from(cityZips)
        .where(inArray(cityZips.zip, normalized))

    const byZip = new Map<string, ZipMapPoint>()
    for (const row of rows) {
        if (!row.zip || byZip.has(row.zip)) continue
        const latitude = String(row.lat ?? "")
        const longitude = String(row.lng ?? "")
        if (!latitude || !longitude) continue
        byZip.set(row.zip, { zip: row.zip, latitude, longitude })
    }

    return normalized
        .map((zip) => byZip.get(zip))
        .filter((point): point is ZipMapPoint => Boolean(point))
}
