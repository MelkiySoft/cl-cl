"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { LayoutDashboard, LogOut, User } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

function getDashboardPath(role?: string) {
    switch (role) {
        case "admin":
            return "/admin"
        case "provider":
            return "/provider"
        case "customer":
            return "/customer"
        default:
            return "/"
    }
}

export function UserNav() {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return <div className="size-9 rounded-full bg-muted animate-pulse" />
    }

    if (!session?.user) {
        return (
            <div className="flex items-center gap-2">
                <Link
                    href="/login"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                    Log in
                </Link>
                <Link
                    href="/register"
                    className={cn(buttonVariants({ size: "sm" }))}
                >
                    Sign up
                </Link>
            </div>
        )
    }

    const { user } = session
    const initials = user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : user.email?.[0]?.toUpperCase() ?? "U"

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" className="relative size-9 rounded-full" />
                }
            >
                <Avatar className="size-9">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem render={<Link href={getDashboardPath(user.role)} />}>
                        <LayoutDashboard className="mr-2 size-4" />
                        Dashboard
                    </DropdownMenuItem>

                    <DropdownMenuItem render={<Link href="/profile" />}>
                        <User className="mr-2 size-4" />
                        Profile
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => signOut({ callbackUrl: "/" })}
                    >
                        <LogOut className="mr-2 size-4" />
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}