import { ArticleCarousel } from "@/components/site/article-carousel"
import { CompanyCarousel } from "@/components/site/company-carousel"
import { CategorySlider } from "@/components/site/home/category-slider"
import { CitiesBlock } from "@/components/site/home/cities-block"
import { WhyChoose } from "@/components/site/home/why-choose"
import {
    HeroBanner,
    type HeroCategoryOption,
} from "@/components/site/home/hero-banner"
import { getCategoryTree, type CategoryNode } from "@/lib/categories"

function flattenCategories(
    nodes: CategoryNode[],
    ancestors: { name: string; slug: string }[] = []
): HeroCategoryOption[] {
    return nodes.flatMap((node) => {
        const path = [...ancestors, { name: node.name, slug: node.slug }]
        const current: HeroCategoryOption = {
            id: node.id,
            name: node.name,
            slugs: path.map((item) => item.slug),
            label: path.map((item) => item.name).join(" / "),
        }
        return [current, ...flattenCategories(node.children, path)]
    })
}

export default async function HomePage() {
    const tree = await getCategoryTree()
    const categories = flattenCategories(tree)

    return (
        <div className="space-y-24 pb-24">
            <HeroBanner categories={categories} />

            <div className="container mx-auto space-y-24 px-4">
                <CategorySlider />

                <WhyChoose />

                <CitiesBlock />

                <CompanyCarousel
                    title="Featured Cleaning Companies"
                    companyIds={[5, 8, 2, 3, 1]}
                />

                <CompanyCarousel
                    title="Top in Orlando"
                    companyIds={[1, 3, 5, 7, 9]}
                    autoplay
                />

                <CompanyCarousel
                    title="Top in Jacksonville"
                    companyIds={[2, 4, 6, 8, 10]}
                    autoplay
                />

{/*                <ArticleCarousel
                    title="Latest Articles"
                    articleIds={[5, 36, 7, 60, 1]}
                    autoplay={{ delay: 1000 }}
                />*/}

            </div>
        </div>
    )
}
