"use client"

import * as React from "react"
import { AppLink } from "@/components/ui/app-link"
import { useSession, signOut } from "next-auth/react"
import { Menu, LayoutDashboard, LogOut, LogIn, UserPlus } from "lucide-react"
import { CityPicker } from "./city-picker"
import { buildCatalogPath } from "@/lib/catalog-path"
import { useSelectedCity } from "@/hooks/use-selected-city"
import { Button, buttonVariants } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "./theme-toggle"
import { cn } from "@/lib/utils"
import type { MenuCategory } from "@/lib/categories"

const NAV_LINKS = [
    { href: "/blog", label: "Blog" },
    { href: "/article/about", label: "About" },
    { href: "/article/contact", label: "Contact" },
]

type MobileNavProps = {
    categories: MenuCategory[]
}

export function MobileNav({ categories }: MobileNavProps) {
    const [open, setOpen] = React.useState(false)
    const { data: session } = useSession()
    const { citySlug } = useSelectedCity()

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
                render={
                    <Button variant="ghost" size="icon" className="lg:hidden size-9" />
                }
            >
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
            </SheetTrigger>

            <SheetContent
                side="right"
                className="w-full max-w-xs p-0 flex flex-col h-full"
            >
                <SheetHeader className="p-4 border-b shrink-0">
                    <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>

                <div className="p-4 border-b md:hidden">
                    <CityPicker onPicked={() => setOpen(false)} />
                </div>

                {/* Скроллируемая часть */}
                <div className="flex-1 overflow-y-auto overscroll-contain py-4">
                    {/* Catalog */}
                    <div className="px-4 pb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Catalog
                        </p>
                        <div className="space-y-1">
                            {categories.map((cat) => (
                                <div key={cat.id}>
                                    <AppLink
                                        href={buildCatalogPath({ citySlug, categorySlugs: [cat.slug] })}
                                        onClick={() => setOpen(false)}
                                        className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
                                    >
                                        {cat.name}
                                    </AppLink>
                                    {cat.children.map((child) => (
                                        <AppLink
                                            key={child.id}
                                            href={buildCatalogPath({ citySlug, categorySlugs: [cat.slug, child.slug] })}
                                            onClick={() => setOpen(false)}
                                            className="block rounded-md pl-6 pr-3 py-1.5 text-sm text-muted-foreground hover:bg-accent transition-colors"
                                        >
                                            {child.name}
                                        </AppLink>
                                    ))}
                                </div>
                            ))}
                            <AppLink
                                href={buildCatalogPath({ citySlug })}
                                onClick={() => setOpen(false)}
                                className="block rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent transition-colors"
                            >
                                All categories →
                            </AppLink>
                        </div>
                    </div>

                    <Separator />

                    {/* Other links */}
                    <div className="px-4 py-3 space-y-1">
                        {NAV_LINKS.map((link) => (
                            <AppLink
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
                            >
                                {link.label}
                            </AppLink>
                        ))}
                    </div>

                    <Separator />

                    {/* Auth / User */}
                    <div className="px-4 py-3 space-y-2">
                        {session?.user ? (
                            <>
                                <div className="px-3 py-2">
                                    <p className="text-sm font-medium">{session.user.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {session.user.email}
                                    </p>
                                </div>
                                <AppLink
                                    href={
                                        session.user.role === "admin"
                                            ? "/admin"
                                            : session.user.role === "provider"
                                                ? "/provider"
                                                : "/customer"
                                    }
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        buttonVariants({ variant: "outline" }),
                                        "w-full justify-start"
                                    )}
                                >
                                    <LayoutDashboard className="mr-2 size-4" />
                                    Dashboard
                                </AppLink>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-destructive"
                                    onClick={() => {
                                        setOpen(false)
                                        signOut({ callbackUrl: "/" })
                                    }}
                                >
                                    <LogOut className="mr-2 size-4" />
                                    Log out
                                </Button>
                            </>
                        ) : (
                            <>
                                <AppLink
                                    href="/login"
                                    onClick={() => setOpen(false)}
                                    className={cn(buttonVariants(), "w-full justify-start")}
                                >
                                    <LogIn className="mr-2 size-4" />
                                    Log in
                                </AppLink>
                                <AppLink
                                    href="/register"
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        buttonVariants({ variant: "outline" }),
                                        "w-full justify-start"
                                    )}
                                >
                                    <UserPlus className="mr-2 size-4" />
                                    Sign up
                                </AppLink>
                            </>
                        )}
                    </div>

                    <Separator />

                    <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Theme</span>
                        <ThemeToggle />
                    </div>
                </div>
            </SheetContent>

        </Sheet>
    )
}