import { NextResponse } from "next/server"

import { getPublicCityList } from "@/lib/geo"

export async function GET() {
    const cities = await getPublicCityList()
    return NextResponse.json({ cities })
}
