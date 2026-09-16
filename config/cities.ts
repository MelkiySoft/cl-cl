export const PUBLIC_CITIES = [
    { slug: "chicago", city: "Chicago", stateId: "IL", label: "Chicago, IL" },
    { slug: "jacksonville", city: "Jacksonville", stateId: "FL", label: "Jacksonville, FL" },
    { slug: "orlando", city: "Orlando", stateId: "FL", label: "Orlando, FL" },
] as const

export const PUBLIC_CITY_SLUGS = PUBLIC_CITIES.map((c) => c.slug)

export const SSG_CITY_SLUGS = [
    "chicago",
    "jacksonville",
    "orlando",
] as const

export type PublicCitySlug = (typeof PUBLIC_CITIES)[number]["slug"]
export type SsgCitySlug = (typeof SSG_CITY_SLUGS)[number]
export type PublicCityMeta = (typeof PUBLIC_CITIES)[number]

const publicSet = new Set<string>(PUBLIC_CITY_SLUGS)
const ssgSet = new Set<string>(SSG_CITY_SLUGS)

export function isPublicCitySlug(slug: string): slug is PublicCitySlug {
    return publicSet.has(slug)
}

export function isSsgCitySlug(slug: string): slug is SsgCitySlug {
    return ssgSet.has(slug)
}

export function getPublicCityLabel(slug: string): string | null {
    const found = PUBLIC_CITIES.find((c) => c.slug === slug)
    return found?.label ?? null
}

export function getPublicCityMeta(slug: string): PublicCityMeta | null {
    return PUBLIC_CITIES.find((c) => c.slug === slug) ?? null
}

export function getPublicCityByCityState(
    city: string,
    stateId: string
): PublicCityMeta | null {
    const name = city.trim().toLowerCase()
    const state = stateId.trim().toUpperCase()
    if (!name || state.length !== 2) return null
    return (
        PUBLIC_CITIES.find(
            (c) => c.city.toLowerCase() === name && c.stateId === state
        ) ?? null
    )
}
