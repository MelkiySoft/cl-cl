import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { getAdminUserById } from "@/actions/admin-users";
import {
    CompanyStatusBadge,
    RoleBadge,
    SourceBadge,
} from "@/components/dashboard/admin/status-badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type Props = {
    params: Promise<{ id: string }>;
};

function formatDate(value: Date | null) {
    if (!value) return "—";
    return value.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default async function AdminUserPage({ params }: Props) {
    const { id } = await params;
    const user = await getAdminUserById(id);

    if (!user) notFound();

    const fields = [
        { label: "Email", value: user.email },
        { label: "Name", value: user.name || "—" },
        { label: "User ID", value: user.id },
        { label: "Email verified", value: user.emailVerified ? formatDate(user.emailVerified) : "No" },
        { label: "Created", value: formatDate(user.createdAt) },
        { label: "Updated", value: formatDate(user.updatedAt) },
    ];

    return (
        <div className="space-y-6">
            <div>
                <AppLink
                    href="/admin/users"
                    className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="mr-1 size-4" />
                    Back to users
                </AppLink>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {user.name || user.email}
                    </h1>
                    <RoleBadge role={user.role} />
                </div>
                <p className="mt-1 text-muted-foreground">{user.email}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid gap-3 sm:grid-cols-2">
                        {fields.map((field) => (
                            <div key={field.label}>
                                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                    {field.label}
                                </dt>
                                <dd className="mt-1 break-all">{field.value}</dd>
                            </div>
                        ))}
                    </dl>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <h2 className="text-lg font-semibold tracking-tight">
                    Companies ({user.companies.length})
                </h2>

                {user.companies.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-muted-foreground">
                            This user has no companies
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
                        <table className="w-full min-w-[640px] text-left text-sm">
                            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Company</th>
                                    <th className="px-4 py-3 font-medium">Source</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">City</th>
                                </tr>
                            </thead>
                            <tbody>
                                {user.companies.map((company) => (
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
