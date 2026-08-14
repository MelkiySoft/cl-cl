import { CompanyCarousel } from "@/components/site/company-carousel"
import { ArticleCarousel } from "@/components/site/article-carousel"

export default function HomePage() {
    return (
        <div className="container mx-auto px-4 py-16 space-y-16">
            <h1 className="text-4xl font-bold tracking-tight">
                Find the best cleaning companies in the USA
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
                Browse verified providers by category, location and ratings.
            </p>


            <CompanyCarousel
                title="Featured Cleaning Companies"
                companyIds={[1211, 1213, 1217, 1212, 1215]}
            />

            <CompanyCarousel
                title="Top in New York"
                companyIds={[1218, 1215, 1210, 1211, 1213]}
                autoplay
            />

            <ArticleCarousel
                title="Latest Articles"
                articleIds={[11, 14, 17, 12, 13]}
                autoplay={{ delay: 1000 }}
            />

        </div>
    )
}