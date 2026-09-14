import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/db/schema";

export const ADMIN_PAGE_SIZE = 25;

export async function requireAdmin() {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "admin") {
        return null;
    }

    return session;
}

export async function requireAdminPage() {
    const session = await requireAdmin();

    if (!session) {
        const current = await auth();
        if (current?.user?.role === "provider") redirect("/provider");
        if (current?.user?.role === "customer") redirect("/customer");
        redirect("/login");
    }

    return session;
}

export function firstSearchParam(
    value: string | string[] | undefined
): string {
    if (Array.isArray(value)) return value[0] ?? "";
    return value ?? "";
}

export function parsePage(value: string | string[] | undefined): number {
    const raw = Number(firstSearchParam(value));
    if (!Number.isFinite(raw) || raw < 1) return 1;
    return Math.floor(raw);
}

export function isUserRole(value: string): value is UserRole {
    return value === "customer" || value === "provider" || value === "admin";
}
