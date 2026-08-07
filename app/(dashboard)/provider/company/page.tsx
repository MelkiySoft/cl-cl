import Link from "next/link";
import { Plus } from "lucide-react";
import { getMyCompanies } from "@/actions/provider-company";
import { buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StatusBadge({
                         moderationStatus,
                         status,
                     }: {
    moderationStatus: string;
    status: boolean;
}) {
    if (moderationStatus === "approved" && status) {
        return (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Live
            </span>
        );
    }
    if (moderationStatus === "approved") {
        return (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Approved (hidden)
            </span>
        );
    }
    if (moderationStatus === "rejected") {
        return (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                Rejected
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending review
        </span>
    );
}

export default async function ProviderCompaniesPage() {
    const companies = await getMyCompanies();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        My Companies
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Manage your cleaning business profiles
                    </p>
                </div>

                <Link
                    href="/provider/company/new"
                    className={cn(buttonVariants())}
                >
                    <Plus className="mr-2 size-4" />
                    Add company
                </Link>
            </div>

            {companies.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No companies yet</CardTitle>
                        <CardDescription>
                            Create your first company profile to appear in the
                            catalog after moderation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/provider/company/new"
                            className={cn(buttonVariants())}
                        >
                            <Plus className="mr-2 size-4" />
                            Create company
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col gap-4">
                    {companies.map((company) => (
                        <Link
                            key={company.id}
                            href={`/provider/company/${company.id}`}
                            className="block transition-opacity hover:opacity-90"
                        >
                            <Card className="overflow-hidden">
                                <div className="flex flex-col sm:flex-row">
                                    {/* Image */}
                                    <div className="relative h-40 w-full shrink-0 bg-muted sm:h-auto sm:w-44">
                                        {company.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={company.image}
                                                alt={company.name}
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center text-2xl font-semibold text-muted-foreground">
                                                {company.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()
                                                    .slice(0, 2)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h2 className="truncate text-lg font-semibold leading-tight">
                                                    {company.name}
                                                </h2>
                                                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                                    /{company.slug}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                moderationStatus={
                                                    company.moderationStatus
                                                }
                                                status={company.status}
                                            />
                                        </div>

                                        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                                            <p className="truncate">
                                                <span className="text-foreground/70">
                                                    Legal:
                                                </span>{" "}
                                                {company.legalName}
                                            </p>
                                            {company.dbaName && (
                                                <p className="truncate">
                                                    <span className="text-foreground/70">
                                                        DBA:
                                                    </span>{" "}
                                                    {company.dbaName}
                                                </p>
                                            )}
                                            <p className="capitalize">
                                                <span className="text-foreground/70">
                                                    Type:
                                                </span>{" "}
                                                {company.entityType}
                                            </p>
                                        </div>

                                        {company.description && (
                                            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                                                {company.description}
                                            </p>
                                        )}

                                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            {company.phone && (
                                                <span>{company.phone}</span>
                                            )}
                                            {company.email && (
                                                <span className="truncate">
                                                    {company.email}
                                                </span>
                                            )}
                                            {company.website && (
                                                <span className="truncate">
                                                    {company.website.replace(
                                                        /^https?:\/\//,
                                                        ""
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        {company.moderationStatus ===
                                            "rejected" &&
                                            company.moderationNote && (
                                                <p className="mt-2 text-xs text-destructive">
                                                    {company.moderationNote}
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}