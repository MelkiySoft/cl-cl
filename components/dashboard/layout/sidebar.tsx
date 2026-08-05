"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/db/schema";
import { getNavItems } from "./nav-config";

type SidebarProps = {
    role: UserRole;
};

export function NavLinks({
                             role,
                             onNavigate,
                         }: {
    role: UserRole;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();
    const items = getNavItems(role);

    return (
        <nav className="flex flex-col gap-1">
            {items.map((item) => {
                const isActive =
                    pathname === item.href ||
                    (item.href !== "/" &&
                        !["/admin", "/provider", "/customer"].includes(item.href) &&
                        pathname.startsWith(item.href));

                // Для корневых dashboard-страниц делаем точное совпадение
                const exactActive =
                    item.href === "/admin" ||
                    item.href === "/provider" ||
                    item.href === "/customer"
                        ? pathname === item.href
                        : isActive;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            exactActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <item.icon className="size-4 shrink-0" />
                        {item.title}
                    </Link>
                );
            })}
        </nav>
    );
}

/** Только десктопный сайдбар */
export function DashboardSidebar({ role }: SidebarProps) {
    return (
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background">
            <div className="flex h-14 items-center border-b px-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 font-semibold tracking-tight"
                >
                    <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-black">
                        CL
                    </span>
                    <span>
                        cl-<span className="text-primary">cl</span>
                    </span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <NavLinks role={role} />
            </div>
        </aside>
    );
}