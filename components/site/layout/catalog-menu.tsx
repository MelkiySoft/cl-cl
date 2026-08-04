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
import type { MenuCategory } from "@/lib/categories"

type CatalogMenuProps = {
    categories: MenuCategory[]
}

export function CatalogMenu({ categories }: CatalogMenuProps) {
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

            <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                        Categories
                    </DropdownMenuLabel>

                    {categories.map((cat) => (
                        <div key={cat.id}>
                            <DropdownMenuItem render={<Link href={`/catalog/${cat.slug}`} />}>
                                {cat.name}
                            </DropdownMenuItem>

                            {cat.children.map((child) => (
                                <DropdownMenuItem
                                    key={child.id}
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