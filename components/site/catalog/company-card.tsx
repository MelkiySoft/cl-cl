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
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-medium">
                    <Shield className="size-3" />
                    Insured
                </span>
            )}
            {company.isBonded && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-[11px] font-medium">
                    <BadgeCheck className="size-3" />
                    Bonded
                </span>
            )}
            {company.isLicensed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 px-2 py-0.5 text-[11px] font-medium">
                    <Award className="size-3" />
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
        <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
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
                <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-1">
                    {company.name}
                </h3>

                {location && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        {location}
                    </p>
                )}

                {company.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
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
                "flex-row items-stretch gap-0 py-0",
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

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-4 py-3 sm:px-5 sm:py-4">
                <h3 className="font-semibold text-base sm:text-lg leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {company.name}
                </h3>

                {location && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{location}</span>
                    </p>
                )}

                {company.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed">
                        {company.description}
                    </p>
                )}

                <TrustBadges company={company} />
            </div>
        </Card>
    )
}
