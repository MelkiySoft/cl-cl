import { AppLink } from "@/components/ui/app-link"
import Image from "next/image"
import { Shield, BadgeCheck, Award, MapPin } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CatalogCompany } from "@/lib/categories"

type CompanyCardProps = {
    company: CatalogCompany
    priority?: boolean
    /** tile — карусель / сетка. row — полный ряд в каталоге. */
    variant?: "tile" | "row"
}

export function CompanyCard({
                                company,
                                priority = false,
                                variant = "tile",
                            }: CompanyCardProps) {
    const location = company.sCity ?? ""

    return (
        <AppLink href={`/company/${company.slug}`} className="group block h-full">
            {variant === "row" ? (
                <RowCard
                    company={company}
                    location={location}
                    priority={priority}
                />
            ) : (
                <TileCard
                    company={company}
                    location={location}
                    priority={priority}
                />
            )}
        </AppLink>
    )
}

function TrustBadges({ company }: { company: CatalogCompany }) {
    if (!company.isInsured && !company.isBonded && !company.isLicensed) {
        return null
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {company.isInsured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-muted text-success px-2.5 py-0.5 text-base">
                    <Shield className="size-3.5" />
                    Insured
                </span>
            )}
            {company.isBonded && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent text-primary px-2.5 py-0.5 text-base">
                    <BadgeCheck className="size-3.5" />
                    Bonded
                </span>
            )}
            {company.isLicensed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent text-primary px-2.5 py-0.5 text-base">
                    <Award className="size-3.5" />
                    Licensed
                </span>
            )}
        </div>
    )
}

function TileCard({
                      company,
                      location,
                      priority,
                  }: {
    company: CatalogCompany
    location: string
    priority: boolean
}) {
    return (
        <Card className="h-full overflow-hidden rounded-lg transition-shadow hover:shadow-md">
            <div className="relative aspect-[16/9] bg-muted overflow-hidden">
                {company.image ? (
                    <Image
                        src={company.image}
                        alt={company.name}
                        fill
                        priority={priority}
                        className="object-contain p-3"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                        No photo
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 p-4 pt-3">
                <h3 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                    {company.name}
                </h3>

                {location && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-4 shrink-0" />
                        {location}
                    </p>
                )}

                {company.description && (
                    <p className="text-base text-muted-foreground line-clamp-2">
                        {company.description}
                    </p>
                )}

                <TrustBadges company={company} />
            </div>
        </Card>
    )
}

function RowCard({
                     company,
                     location,
                     priority,
                 }: {
    company: CatalogCompany
    location: string
    priority: boolean
}) {
    return (
        <Card
            className={cn(
                "flex-row items-stretch gap-0 py-0 rounded-lg",
                "transition-shadow hover:shadow-md"
            )}
        >
            <div className="relative w-24 sm:w-32 md:w-40 shrink-0 self-stretch bg-muted">
                {company.image ? (
                    <Image
                        src={company.image}
                        alt={company.name}
                        fill
                        priority={priority}
                        className="object-contain p-3"
                        sizes="160px"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs px-2 text-center">
                        No photo
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                    <h3 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10 group-hover:text-primary transition-colors line-clamp-2">
                        {company.name}
                    </h3>

                    {location && (
                        <p className="flex items-center gap-1.5 text-lg text-muted-foreground">
                            <MapPin className="size-4 shrink-0" />
                            <span className="truncate">{location}</span>
                        </p>
                    )}

                    {company.description && (
                        <p className="text-base text-muted-foreground line-clamp-2 sm:line-clamp-3">
                            {company.description}
                        </p>
                    )}

                    <TrustBadges company={company} />
                </div>

                <span
                    className={cn(
                        "hidden sm:inline-flex shrink-0 items-center justify-center",
                        "rounded-lg bg-primary px-5 py-2 text-primary-foreground",
                        "text-2xl font-semibold whitespace-nowrap",
                        "transition-opacity group-hover:opacity-90"
                    )}
                >
                    View profile
                </span>
            </div>
        </Card>
    )
}
