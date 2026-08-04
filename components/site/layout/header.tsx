"use client"

import Link from "next/link"

import { Logo } from "./logo"
import { CatalogMenu } from "./catalog-menu"
import { ThemeToggle } from "./theme-toggle"
import { UserNav } from "./user-nav"
import { MobileNav } from "./mobile-nav"
import type { MenuCategory } from "@/lib/categories"

const NAV_LINKS = [
    { href: "/articles", label: "Articles" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
]

type HeaderProps = {
    categories: MenuCategory[]
}

export function Header({ categories }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
                {/* Left */}
                <div className="flex items-center gap-6">
                    <Logo />

                    {/* Desktop nav */}
                    <nav className="hidden lg:flex items-center gap-1">
                        <CatalogMenu categories={categories} />
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent/50"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2">
                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>
                    <div className="hidden lg:block">
                        <UserNav />
                    </div>
                    <MobileNav categories={categories} />
                </div>
            </div>
        </header>
    )
}