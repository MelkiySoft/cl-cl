import { Plus } from "lucide-react";

import { auth } from "@/lib/auth";
import { getMyCompanies } from "@/actions/provider-company";
import { AppLink } from "@/components/ui/app-link";
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

export default async function ProviderPage() {
    const session = await auth();
    const companies = await getMyCompanies();

    const liveCount = companies.filter(
        (company) => company.moderationStatus === "approved" && company.status
    ).length;
    const pendingCount = companies.filter(
        (company) => company.moderationStatus === "pending"
    ).length;
    const rejectedCount = companies.filter(
        (company) => company.moderationStatus === "rejected"
    ).length;

    const firstName = session?.user?.name?.split(" ")[0] || "there";

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome, {firstName}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Your company profiles and catalog status
                    </p>
                </div>
                <AppLink href="/provider/company/new" className={cn(buttonVariants())}>
                    <Plus className="mr-2 size-4" />
                    Add company
                </AppLink>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AppLink href="/provider/company" className="block transition-opacity hover:opacity-90">
                    <Card>
                        <CardHeader>
                            <CardDescription>Companies</CardDescription>
                            <CardTitle className="text-3xl tabular-nums">
                                {companies.length}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">All your profiles</p>
                        </CardContent>
                    </Card>
                </AppLink>
                <Card>
                    <CardHeader>
                        <CardDescription>Live</CardDescription>
                        <CardTitle className="text-3xl tabular-nums">{liveCount}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Visible in catalog</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Pending</CardDescription>
                        <CardTitle className="text-3xl tabular-nums">{pendingCount}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Waiting for review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Rejected</CardDescription>
                        <CardTitle className="text-3xl tabular-nums">{rejectedCount}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Need changes</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                    <div>
                        <CardTitle>Your companies</CardTitle>
                        <CardDescription>
                            {companies.length === 0
                                ? "Create a profile to appear in the catalog"
                                : "Open a company to edit details and documents"}
                        </CardDescription>
                    </div>
                    {companies.length > 0 && (
                        <AppLink
                            href="/provider/company"
                            className="text-sm underline underline-offset-4"
                        >
                            View all
                        </AppLink>
                    )}
                </CardHeader>
                <CardContent>
                    {companies.length === 0 ? (
                        <AppLink href="/provider/company/new" className={cn(buttonVariants())}>
                            <Plus className="mr-2 size-4" />
                            Create company
                        </AppLink>
                    ) : (
                        <ul className="divide-y divide-foreground/10">
                            {companies.slice(0, 6).map((company) => (
                                <li key={company.id}>
                                    <AppLink
                                        href={`/provider/company/${company.id}`}
                                        className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{company.name}</p>
                                            <p className="truncate text-sm text-muted-foreground">
                                                /{company.slug}
                                            </p>
                                        </div>
                                        <StatusBadge
                                            moderationStatus={company.moderationStatus}
                                            status={company.status}
                                        />
                                    </AppLink>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
