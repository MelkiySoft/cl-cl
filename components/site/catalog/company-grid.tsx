import { CompanyCard } from "./company-card"
import type { CatalogCompany } from "@/lib/categories"

type CompanyGridProps = {
    companies: CatalogCompany[]
}

export function CompanyGrid({ companies }: CompanyGridProps) {
    if (companies.length === 0) {
        return (
            <div className="rounded-xl border border-dashed p-12 text-center">
                <p className="text-muted-foreground">
                    No companies found in this category yet.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {companies.map((company, index) => (
                <CompanyCard
                    key={company.id}
                    company={company}
                    variant="row"
                    priority={index < 3}
                />
            ))}
        </div>
    )
}
