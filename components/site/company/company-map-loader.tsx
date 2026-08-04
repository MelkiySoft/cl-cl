"use client"

import dynamic from "next/dynamic"

const CompanyMap = dynamic(
    () =>
        import("@/components/site/company/company-map").then((m) => m.CompanyMap),
    {
        ssr: false,
        loading: () => (
            <div className="rounded-xl bg-muted animate-pulse aspect-[16/10]" />
        ),
    }
)

type Props = {
    latitude: string
    longitude: string
    radiusMeters?: number
    className?: string
}

export function CompanyMapLoader(props: Props) {
    return <CompanyMap {...props} />
}