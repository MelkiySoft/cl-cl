import Image from "next/image"
import { and, asc, eq, isNull } from "drizzle-orm"

import { AppLink } from "@/components/ui/app-link"
import { db } from "@/db"
import { categories } from "@/db/schema"
import { buildCatalogPath } from "@/lib/catalog-path"

export async function CategorySlider() {
    const roots = await db.query.categories.findMany({
        where: and(isNull(categories.parentId), eq(categories.status, true)),
        orderBy: [asc(categories.sortOrder)],
        columns: {
            id: true,
            name: true,
            slug: true,
            image: true,
        },
    })

    if (roots.length === 0) return null

    return (
        <section className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight">
                Explore services
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {roots.map((category, index) => {
                    const src =
                        category.image || `/demo/category/${category.slug}.jpg`

                    return (
                        <AppLink
                            key={category.id}
                            href={buildCatalogPath({
                                categorySlugs: [category.slug],
                            })}
                            className="group relative block overflow-hidden rounded-xl aspect-[4/3] bg-muted"
                        >
                            <Image
                                src={src}
                                alt={category.name}
                                fill
                                priority={index < 4}
                                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            <span className="absolute inset-x-0 bottom-0 p-4 text-lg font-semibold text-white">
                                {category.name}
                            </span>
                        </AppLink>
                    )
                })}
            </div>
        </section>
    )
}
