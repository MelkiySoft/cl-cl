/** Города, которые вообще существуют на портале */
export const PUBLIC_CITY_SLUGS = [
    "new-york",
    "los-angeles",
    "chicago",
    "houston",
    "miami",
] as const

/** Подмножество для generateStaticParams */
export const SSG_CITY_SLUGS = [
    "new-york",
    "los-angeles",
] as const

export type PublicCitySlug = (typeof PUBLIC_CITY_SLUGS)[number]
export type SsgCitySlug = (typeof SSG_CITY_SLUGS)[number]

const publicSet = new Set<string>(PUBLIC_CITY_SLUGS)
const ssgSet = new Set<string>(SSG_CITY_SLUGS)

export function isPublicCitySlug(slug: string): slug is PublicCitySlug {
    return publicSet.has(slug)
}

export function isSsgCitySlug(slug: string): slug is SsgCitySlug {
    return ssgSet.has(slug)
}