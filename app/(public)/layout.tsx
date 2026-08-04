import { Header } from "@/components/site/layout/header"
import { Footer } from "@/components/site/layout/footer"

export default function PublicLayout({
                                         children,
                                     }: {
    children: React.ReactNode
}) {
    return (
        <>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </>
    )
}