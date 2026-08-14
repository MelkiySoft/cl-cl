import { CarouselItem } from "@/components/ui/carousel"
import { CompanyCard } from "@/components/site/catalog/company-card"
import { getCompaniesByIds } from "@/lib/companies"
import { CarouselShell } from "@/components/site/carousel-shell"
import { cn } from "@/lib/utils"

type CompanyCarouselProps = {
    title: string
    companyIds: number[]
    className?: string
    /** Включить автопрокрутку */
    autoplay?: boolean | { delay?: number }
}

export async function CompanyCarousel({
                                          title,
                                          companyIds,
                                          className,
                                          autoplay = false,
                                      }: CompanyCarouselProps) {
    const companies = await getCompaniesByIds(companyIds)

    if (companies.length === 0) return null

    return (
        <section className={cn("space-y-5", className)}>
            {title && (
                <div className="flex items-end justify-between gap-4">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        {title}
                    </h2>
                </div>
            )}

            <CarouselShell
                autoplay={autoplay}
                loop={companies.length > 3}
            >
                {companies.map((company, index) => (
                    <CarouselItem
                        key={company.id}
                        className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                    >
                        <div className="h-full p-px">
                            <CompanyCard
                                company={company}
                                priority={index < 2}
                            />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselShell>
        </section>
    )
}