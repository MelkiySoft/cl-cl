"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Menu, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavLinks } from "./sidebar";
import type { UserRole } from "@/db/schema";

type HeaderProps = {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role: UserRole;
    };
};

export function DashboardHeader({ user }: HeaderProps) {
    const [open, setOpen] = useState(false);

    const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user.email?.[0]?.toUpperCase() ?? "U";

    return (
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
            {/* Mobile menu */}
            <div className="lg:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger
                        render={
                            <Button variant="ghost" size="icon" className="size-9" />
                        }
                    >
                        <Menu className="size-5" />
                        <span className="sr-only">Open menu</span>
                    </SheetTrigger>

                    <SheetContent side="left" className="w-72 p-0">
                        <SheetHeader className="border-b px-4 py-3">
                            <SheetTitle className="text-left">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 font-semibold"
                                    onClick={() => setOpen(false)}
                                >
                                    <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-black">
                                        CL
                                    </span>
                                    <span>
                                        cl-<span className="text-primary">cl</span>
                                    </span>
                                </Link>
                            </SheetTitle>
                        </SheetHeader>

                        <div className="p-4">
                            <NavLinks
                                role={user.role}
                                onNavigate={() => setOpen(false)}
                            />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* User menu */}
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            className="relative size-9 rounded-full"
                        />
                    }
                >
                    <Avatar className="size-9">
                        <AvatarImage
                            src={user.image ?? undefined}
                            alt={user.name ?? ""}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {user.name}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuItem render={<Link href="/account" />}>
                            <User className="mr-2 size-4" />
                            Account
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                        >
                            <LogOut className="mr-2 size-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}