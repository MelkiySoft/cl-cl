import Link from "next/link"
import Image from "next/image"
import { Shield, BadgeCheck, Award, MapPin } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { CatalogCompany } from "@/lib/categories"

type CompanyCardProps = {
    company: CatalogCompany
    priority?: boolean
}

export function CompanyCard({ company, priority = false }: CompanyCardProps) {
    const location = [company.city, company.state].filter(Boolean).join(", ")

    return (
        <Link href={`/company/${company.slug}`} prefetch={false} className="group block h-full">
            <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
                {/* Image */}
                <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                    {company.image ? (
                        <Image
                            src={company.image}
                            alt={company.name}
                            fill
                            priority={priority}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                            No photo
                        </div>
                    )}
                </div>

                {/* Content */}
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

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-1">
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
                </div>
            </Card>
        </Link>
    )
}