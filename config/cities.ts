export const PUBLIC_CITIES = [
    { slug: "new-york", label: "New York, NY" },
    { slug: "los-angeles", label: "Los Angeles, CA" },
    { slug: "chicago", label: "Chicago, IL" },
    { slug: "houston", label: "Houston, TX" },
    { slug: "miami", label: "Miami, FL" },
] as const

export const PUBLIC_CITY_SLUGS = PUBLIC_CITIES.map((c) => c.slug)

export const SSG_CITY_SLUGS = [
    "new-york",
    "los-angeles",
] as const

export type PublicCitySlug = (typeof PUBLIC_CITIES)[number]["slug"]
export type SsgCitySlug = (typeof SSG_CITY_SLUGS)[number]

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