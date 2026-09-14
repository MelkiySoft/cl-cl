import { Suspense } from "react";

import { AppLink } from "@/components/ui/app-link";
import { getAdminCompanies } from "@/actions/admin-companies";
import {
    CompanyStatusBadge,
    SourceBadge,
} from "@/components/dashboard/admin/status-badge";
import { CatalogPagination } from "@/components/site/catalog/catalog-pagination";
import { firstSearchParam, parsePage } from "@/lib/admin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: Date) {
    return value.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default async function AdminCompaniesPage({ searchParams }: Props) {
    const params = await searchParams;
    const q = firstSearchParam(params.q);
    const source = firstSearchParam(params.source);
    const moderation = firstSearchParam(params.moderation);
    const status = firstSearchParam(params.status);
    const claimed = firstSearchParam(params.claimed);
    const page = parsePage(params.page);

    const result = await getAdminCompanies({
        q,
        source,
        moderation,
        status,
        claimed,
        page,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
                <p className="mt-1 text-muted-foreground">
                    {result.total} compan{result.total === 1 ? "y" : "ies"}
                </p>
            </div>

            <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-6 xl:items-end">
                <div className="space-y-1 md:col-span-2 xl:col-span-2">
                    <label htmlFor="q" className="text-sm font-medium">
                        Search
                    </label>
                    <input
                        id="q"
                        name="q"
                        defaultValue={q}
                        placeholder="Name, slug, email, phone, external id"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="source" className="text-sm font-medium">
                        Source
                    </label>
                    <select
                        id="source"
                        name="source"
                        defaultValue={source}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All</option>
                        <option value="registered">Registered</option>
                        <option value="imported">Imported</option>
                        <option value="seed">Seed</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="moderation" className="text-sm font-medium">
                        Moderation
                    </label>
                    <select
                        id="moderation"
                        name="moderation"
                        defaultValue={moderation}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="status" className="text-sm font-medium">
                        Visibility
                    </label>
                    <select
                        id="status"
                        name="status"
                        defaultValue={status}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All</option>
                        <option value="live">Live</option>
                        <option value="hidden">Hidden</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label htmlFor="claimed" className="text-sm font-medium">
                        Owner
                    </label>
                    <select
                        id="claimed"
                        name="claimed"
                        defaultValue={claimed}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">All</option>
                        <option value="1">Claimed</option>
                        <option value="0">Unclaimed</option>
                    </select>
                </div>
                <button type="submit" className={cn(buttonVariants(), "xl:col-span-6 w-fit")}>
                    Apply
                </button>
            </form>

            <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 font-medium">Company</th>
                            <th className="px-4 py-3 font-medium">Owner</th>
                            <th className="px-4 py-3 font-medium">Source</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">City</th>
                            <th className="px-4 py-3 font-medium">Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.companies.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                                    No companies found
                                </td>
                            </tr>
                        ) : (
                            result.companies.map((company) => (
                                <tr
                                    key={company.id}
                                    className="border-t border-foreground/10 hover:bg-muted/40"
                                >
                                    <td className="px-4 py-3">
                                        <AppLink
                                            href={`/admin/companies/${company.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {company.name}
                                        </AppLink>
                                        <div className="text-muted-foreground">
                                            /{company.slug}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {company.ownerId ? (
                                            <AppLink
                                                href={`/admin/users/${company.ownerId}`}
                                                className="hover:underline"
                                            >
                                                {company.ownerName || company.ownerEmail}
                                            </AppLink>
                                        ) : (
                                            <span className="text-muted-foreground">Unclaimed</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <SourceBadge source={company.source} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <CompanyStatusBadge
                                            moderationStatus={company.moderationStatus}
                                            status={company.status}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {company.sCity || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(company.updatedAt)}
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
