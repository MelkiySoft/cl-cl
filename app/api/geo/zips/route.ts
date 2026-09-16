import { NextRequest, NextResponse } from "next/server"

import { parseServiceCityLabel, searchGeoZips } from "@/lib/geo"

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get("q") ?? ""
    const sCity = request.nextUrl.searchParams.get("sCity") ?? ""
    const parsed = parseServiceCityLabel(sCity)

    const zipPrefix = q.replace(/\D/g, "")
    const searchStatewide = zipPrefix.length >= 2

    const zips = await searchGeoZips({
        query: q,
        city: searchStatewide ? undefined : parsed?.city,
        stateId: parsed?.stateId,
        publicOnly: !searchStatewide,
    })

    return NextResponse.json({ zips })
}
