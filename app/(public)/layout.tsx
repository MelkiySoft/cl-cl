import { Header } from "@/components/site/layout/header"
import { Footer } from "@/components/site/layout/footer"
import { getMenuCategories } from "@/lib/categories"

export default async function PublicLayout({
                                               children,
                                           }: {
    children: React.ReactNode
}) {
    const categories = await getMenuCategories()

    return (
        <>
            <Header categories={categories} />
            <main className="flex-1">{children}</main>
            <Footer />
        </>
    )
}