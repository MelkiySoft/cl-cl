import { NextRequest, NextResponse } from "next/server"
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm"

import { db } from "@/db"
import { cities, cityZips } from "@/db/schema"

export type LocationSuggestion = {
    type: "city" | "zip"
    slug: string
    label: string
    city: string
    stateId: string
    isPublic: boolean
    zip?: string
}

function likeContains(value: string): string {
    return `%${value.replace(/[%_\\]/g, "\\$&")}%`
}

export async function GET(request: NextRequest) {
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim()
    const digits = q.replace(/\D/g, "")
    const letters = q.replace(/[0-9]/g, "").trim()
    const suggestions: LocationSuggestion[] = []

    const cityFilters = [eq(cities.isActive, true)]
    if (letters.length >= 1) {
        cityFilters.push(ilike(cities.name, likeContains(letters)))
    }

    if (digits.length < 2 || letters.length >= 1) {
        const cityRows = await db
            .select({
                slug: cities.slug,
                name: cities.name,
                stateId: cities.stateId,
                isPublic: cities.isPublic,
            })
            .from(cities)
            .where(and(...cityFilters))
            .orderBy(desc(cities.population), asc(cities.name))
            .limit(12)

        for (const row of cityRows) {
            suggestions.push({
                type: "city",
                slug: row.slug,
                city: row.name,
                stateId: row.stateId,
                isPublic: row.isPublic,
                label: `${row.name}, ${row.stateId}`,
            })
        }
    }

    if (digits.length >= 2) {
        const zipRows = await db
            .select({
                zip: cityZips.zip,
                slug: cities.slug,
                name: cities.name,
                stateId: cities.stateId,
                isPublic: cities.isPublic,
            })
            .from(cityZips)
            .innerJoin(cities, eq(cities.id, cityZips.cityId))
            .where(
                and(
                    eq(cities.isActive, true),
                    sql`${cityZips.zip} like ${`${digits}%`}`
                )
            )
            .orderBy(asc(cityZips.zip))
            .limit(12)

        for (const row of zipRows) {
            if (!row.zip) continue
            suggestions.push({
                type: "zip",
                zip: row.zip,
                slug: row.slug,
                city: row.name,
                stateId: row.stateId,
                isPublic: row.isPublic,
                label: `${row.zip} — ${row.name}, ${row.stateId}`,
            })
        }
    }

    return NextResponse.json({ suggestions })
}
