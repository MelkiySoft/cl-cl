import {
    LayoutDashboard,
    User,
    Building2,
    ClipboardList,
    Tags,
    Users,
    FileText,
    type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/db/schema";

export type NavItem = {
    title: string;
    href: string;
    icon: LucideIcon;
};

const commonItems: NavItem[] = [
    {
        title: "Account",
        href: "/account",
        icon: User,
    },
];

const roleItems: Record<UserRole, NavItem[]> = {
    customer: [
        {
            title: "Dashboard",
            href: "/customer",
            icon: LayoutDashboard,
        },
        {
            title: "My Requests",
            href: "/customer/requests",
            icon: ClipboardList,
        },
        ...commonItems,
    ],
    provider: [
        {
            title: "Dashboard",
            href: "/provider",
            icon: LayoutDashboard,
        },
        {
            title: "My Company",
            href: "/provider/company",
            icon: Building2,
        },
        {
            title: "Requests",
            href: "/provider/requests",
            icon: ClipboardList,
        },
        ...commonItems,
    ],
    admin: [
        {
            title: "Dashboard",
            href: "/admin",
            icon: LayoutDashboard,
        },
        {
            title: "Companies",
            href: "/admin/companies",
            icon: Building2,
        },
        {
            title: "Categories",
            href: "/admin/categories",
            icon: Tags,
        },
        {
            title: "Users",
            href: "/admin/users",
            icon: Users,
        },
        {
            title: "Articles",
            href: "/admin/articles",
            icon: FileText,
        },
        ...commonItems,
    ],
};

export function getNavItems(role: UserRole): NavItem[] {
    return roleItems[role] ?? commonItems;
}