import { NextResponse } from "next/server"
import { getPublicCityByZip } from "@/lib/geo"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const zip = searchParams.get("zip")

    const city = await getPublicCityByZip(zip)

    if (!city) {
        return NextResponse.json({ city: null }, { status: 404 })
    }

    return NextResponse.json({
        city: {
            slug: city.slug,
            label: `${city.city}, ${city.stateId}`,
        },
    })
}