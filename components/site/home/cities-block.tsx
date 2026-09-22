import { AppLink } from "@/components/ui/app-link"
import { buildCatalogPath } from "@/lib/catalog-path"
import { getPublicCityList } from "@/lib/geo"

export async function CitiesBlock() {
    const cities = await getPublicCityList()

    if (cities.length === 0) return null

    return (
        <section className="space-y-5 text-center">
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Cleanliness coast to coast
                </h2>
                <p className="text-lg text-muted-foreground">
                    Browse verified cleaning companies in cities we serve today.
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
                {cities.map((city) => (
                    <AppLink
                        key={city.slug}
                        href={buildCatalogPath({ citySlug: city.slug })}
                        className="rounded-full bg-accent px-4 py-2 text-base font-medium text-primary transition-colors hover:bg-accent/80"
                    >
                        {city.label}
                    </AppLink>
                ))}
            </div>
        </section>
    )
}
