"use client"

import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const MOCK_CATEGORIES = [
    {
        name: "Residential Cleaning",
        slug: "residential-cleaning",
        children: [
            { name: "House Cleaning", slug: "house-cleaning" },
            { name: "Deep Cleaning", slug: "deep-cleaning" },
            { name: "Move-out / Move-in", slug: "move-out-in-cleaning" },
        ],
    },
    {
        name: "Commercial Cleaning",
        slug: "commercial-cleaning",
        children: [
            { name: "Office Cleaning", slug: "office-cleaning" },
            { name: "Retail Cleaning", slug: "retail-cleaning" },
        ],
    },
    {
        name: "Specialized Services",
        slug: "specialized-services",
        children: [
            { name: "Carpet Cleaning", slug: "carpet-cleaning" },
            { name: "Window Cleaning", slug: "window-cleaning" },
            { name: "Post-Construction", slug: "post-construction" },
        ],
    },
]

export function CatalogMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        className="gap-1.5 font-medium text-base h-10 px-3"
                    />
                }
            >
                Catalog
                <ChevronDown className="size-4 opacity-70" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                        Categories
                    </DropdownMenuLabel>

                    {MOCK_CATEGORIES.map((cat) => (
                        <div key={cat.slug}>
                            <DropdownMenuItem render={<Link href={`/catalog/${cat.slug}`} />}>
                                {cat.name}
                            </DropdownMenuItem>

                            {cat.children?.map((child) => (
                                <DropdownMenuItem
                                    key={child.slug}
                                    render={<Link href={`/catalog/${cat.slug}/${child.slug}`} />}
                                    className="pl-6 text-muted-foreground"
                                >
                                    {child.name}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    ))}
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem render={<Link href="/catalog" />}>
            <span className="font-medium text-primary">
              View all categories →
            </span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}