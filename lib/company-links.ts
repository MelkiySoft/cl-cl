import type { CompanyLinkType } from "@/db/schema"

export const COMPANY_LINK_TYPES = [
    "website",
    "google_business",
    "google_maps",
    "yelp",
    "facebook",
    "instagram",
    "youtube",
    "twitter",
    "linkedin",
    "tiktok",
    "other",
] as const satisfies readonly CompanyLinkType[]

export const COMPANY_LINK_LABELS: Record<CompanyLinkType, string> = {
    website: "Website",
    google_business: "Google Business",
    google_maps: "Google Maps",
    yelp: "Yelp",
    facebook: "Facebook",
    instagram: "Instagram",
    youtube: "YouTube",
    twitter: "X (Twitter)",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    other: "Other",
}

export type CompanyLinkItem = {
    type: CompanyLinkType
    url: string
    sortOrder: number
}

export function getWebsiteUrl(links: CompanyLinkItem[]): string | null {
    return links.find((l) => l.type === "website")?.url ?? null
}

export function sortCompanyLinks(links: CompanyLinkItem[]): CompanyLinkItem[] {
    const order = new Map(COMPANY_LINK_TYPES.map((t, i) => [t, i]))
    return [...links].sort((a, b) => {
        const byType = (order.get(a.type) ?? 99) - (order.get(b.type) ?? 99)
        if (byType !== 0) return byType
        return a.sortOrder - b.sortOrder
    })
}

export function displayLinkHost(url: string): string {
    try {
        const host = new URL(url).hostname.replace(/^www\./, "")
        return host
    } catch {
        return url.replace(/^https?:\/\//, "")
    }
}
