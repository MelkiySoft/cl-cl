"use client"

import * as React from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Menu, LayoutDashboard, LogOut, LogIn, UserPlus } from "lucide-react"

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

const NAV_LINKS = [
    { href: "/articles", label: "Articles" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
]

const MOCK_CATEGORIES = [
    { name: "Residential Cleaning", slug: "residential-cleaning" },
    { name: "Commercial Cleaning", slug: "commercial-cleaning" },
    { name: "Specialized Services", slug: "specialized-services" },
]

export function MobileNav() {
    const [open, setOpen] = React.useState(false)
    const { data: session } = useSession()

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
                render={<Button variant="ghost" size="icon" className="lg:hidden size-9" />}
            >
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
            </SheetTrigger>

            <SheetContent side="right" className="w-full max-w-xs p-0">
                <SheetHeader className="p-4 border-b">
                    <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>

                <div className="flex flex-col py-4">
                    {/* Catalog */}
                    <div className="px-4 pb-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Catalog
                        </p>
                        <div className="space-y-1">
                            {MOCK_CATEGORIES.map((cat) => (
                                <Link
                                    key={cat.slug}
                                    href={`/catalog/${cat.slug}`}
                                    onClick={() => setOpen(false)}
                                    className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                            <Link
                                href="/catalog"
                                onClick={() => setOpen(false)}
                                className="block rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-accent transition-colors"
                            >
                                All categories →
                            </Link>
                        </div>
                    </div>

                    <Separator />

                    {/* Other links */}
                    <div className="px-4 py-3 space-y-1">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
                            >
                                {link.label}
                            </Link>
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
                                <Link
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
                                </Link>
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
                                <Link
                                    href="/login"
                                    onClick={() => setOpen(false)}
                                    className={cn(buttonVariants(), "w-full justify-start")}
                                >
                                    <LogIn className="mr-2 size-4" />
                                    Log in
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        buttonVariants({ variant: "outline" }),
                                        "w-full justify-start"
                                    )}
                                >
                                    <UserPlus className="mr-2 size-4" />
                                    Sign up
                                </Link>
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