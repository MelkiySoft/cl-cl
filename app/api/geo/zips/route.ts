import { NextRequest, NextResponse } from "next/server"

import { parseServiceCityLabel, searchGeoZips } from "@/lib/geo"

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get("q") ?? ""
    const sCity = request.nextUrl.searchParams.get("sCity") ?? ""
    const parsed = parseServiceCityLabel(sCity)

    const zips = await searchGeoZips({
        query: q,
        city: parsed?.city,
        stateId: parsed?.stateId,
    })

    return NextResponse.json({ zips })
}
