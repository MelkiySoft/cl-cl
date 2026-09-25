import { NextRequest, NextResponse } from "next/server"

import { parseServiceCityLabel, searchGeoZips } from "@/lib/geo"

/**
 * GET /api/geo/zips?q=&sCity=&publicOnly=1&activeOnly=1&scoped=1
 *
 * Если передан sCity — поиск всегда в рамках этого города
 * (даже при вводе 2+ цифр ZIP). Statewide — только без sCity.
 */
export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get("q") ?? ""
    const sCity = request.nextUrl.searchParams.get("sCity") ?? ""
    const parsed = parseServiceCityLabel(sCity)
    const publicOnly = request.nextUrl.searchParams.get("publicOnly") === "1"
    const activeOnly = request.nextUrl.searchParams.get("activeOnly") !== "0"
    // scoped=1 или наличие sCity — не уходим в statewide
    const forceScoped =
        request.nextUrl.searchParams.get("scoped") === "1" || Boolean(parsed)

    const zipPrefix = q.replace(/\D/g, "")
    const searchStatewide = zipPrefix.length >= 2 && !forceScoped

    const zips = await searchGeoZips({
        query: q,
        city: searchStatewide ? undefined : parsed?.city,
        stateId: searchStatewide ? undefined : parsed?.stateId,
        publicOnly,
        activeOnly,
    })

    return NextResponse.json({ zips })
}
