import { NextRequest, NextResponse } from "next/server"

import { searchGeoCities } from "@/lib/geo"

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get("q") ?? ""
    const cities = await searchGeoCities(q)
    return NextResponse.json({ cities })
}
