import Link from "next/link"
import { Logo } from "./logo"

const FOOTER_LINKS = [
    {
        title: "Catalog",
        links: [
            { href: "/catalog", label: "All Categories" },
            { href: "/catalog/residential-cleaning", label: "Residential" },
            { href: "/catalog/commercial-cleaning", label: "Commercial" },
        ],
    },
    {
        title: "Company",
        links: [
            { href: "/article/about", label: "About" },
            { href: "/blog", label: "Blog" },
            { href: "/article/contact", label: "Contact" },
        ],
    },
    {
        title: "Legal",
        links: [
            { href: "/article/privacy-policy", label: "Privacy Policy" },
            { href: "/article/terms-of-service", label: "Terms of Service" },
        ],
    },
]

export function Footer() {
    return (
        <footer className="border-t bg-muted/40">
            <div className="container mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Logo />
                        <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
                            Find trusted cleaning companies across the United States.
                            Verified providers, real reviews.
                        </p>
                    </div>

                    {/* Links */}
                    {FOOTER_LINKS.map((group) => (
                        <div key={group.title}>
                            <h3 className="text-sm font-semibold tracking-wide text-foreground">
                                {group.title}
                            </h3>
                            <ul className="mt-4 space-y-2.5">
                                {group.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} cl-cl. All rights reserved.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Made for clean homes & businesses
                    </p>
                </div>
            </div>
        </footer>
    )
}