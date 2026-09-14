import { Suspense } from "react";

import { AppLink } from "@/components/ui/app-link";
import { getAdminUsers } from "@/actions/admin-users";
import { RoleBadge } from "@/components/dashboard/admin/status-badge";
import { CatalogPagination } from "@/components/site/catalog/catalog-pagination";
import { firstSearchParam, parsePage } from "@/lib/admin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: Date | null) {
    if (!value) return "—";
    return value.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default async function AdminUsersPage({ searchParams }: Props) {
    const params = await searchParams;
    const q = firstSearchParam(params.q);
    const role = firstSearchParam(params.role);
    const page = parsePage(params.page);

    const result = await getAdminUsers({ q, role, page });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
                <p className="mt-1 text-muted-foreground">
                    {result.total} account{result.total === 1 ? "" : "s"}
                </p>
            </div>

            <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-1">
                    <label htmlFor="q" className="text-sm font-medium">
                        Search
                    </label>
                    <input
                        id="q"
                        name="q"
                        defaultValue={q}
                        placeholder="Name, email or user id"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                </div>
                <div className="w-full space-y-1 sm:w-44">
                    <label htmlFor="role" className="text-sm font-medium">
                        Role
                    </label>
                    <select
                        id="role"
                        name="role"
                        defaultValue={role}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All roles</option>
                        <option value="customer">Customer</option>
                        <option value="provider">Provider</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button type="submit" className={cn(buttonVariants())}>
                    Apply
                </button>
            </form>

            <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">User</th>
                            <th className="px-4 py-3 font-medium">Role</th>
                            <th className="px-4 py-3 font-medium">Verified</th>
                            <th className="px-4 py-3 font-medium">Companies</th>
                            <th className="px-4 py-3 font-medium">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            result.users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-t border-foreground/10 hover:bg-muted/40"
                                >
                                    <td className="px-4 py-3">
                                        <AppLink
                                            href={`/admin/users/${user.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {user.name || "No name"}
                                        </AppLink>
                                        <div className="text-muted-foreground">{user.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {user.emailVerified ? "Yes" : "No"}
                                    </td>
                                    <td className="px-4 py-3 tabular-nums">{user.companiesCount}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(user.createdAt)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Suspense fallback={null}>
                <CatalogPagination page={result.page} totalPages={result.totalPages} />
            </Suspense>
        </div>
    );
}
