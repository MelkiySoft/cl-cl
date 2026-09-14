import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import { getAdminCompanyById } from "@/actions/admin-companies";
import {
    CompanyStatusBadge,
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {label}
            </dt>
            <dd className="mt-1 break-words">
                {value === null || value === undefined || value === "" ? "—" : value}
            </dd>
        </div>
    );
}

export default async function AdminCompanyPage({ params }: Props) {
    const { id } = await params;
    const companyId = Number(id);

    if (!companyId || Number.isNaN(companyId)) {
        notFound();
    }

    const company = await getAdminCompanyById(companyId);
    if (!company) notFound();

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <AppLink
                    href="/admin/companies"
                    className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="mr-1 size-4" />
                    Back to companies
                </AppLink>

                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {company.name}
                    </h1>
                    <SourceBadge source={company.source} />
                    <CompanyStatusBadge
                        moderationStatus={company.moderationStatus}
                        status={company.status}
                    />
                </div>
                <p className="mt-1 text-muted-foreground">/{company.slug}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Owner</CardTitle>
                </CardHeader>
                <CardContent>
                    {company.owner ? (
                        <div className="space-y-1">
                            <AppLink
                                href={`/admin/users/${company.owner.id}`}
                                className="font-medium hover:underline"
                            >
                                {company.owner.name || company.owner.email}
                            </AppLink>
                            <div className="text-sm text-muted-foreground">
                                {company.owner.email} · {company.owner.role}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Claimed at: {formatDate(company.claimedAt)}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Unclaimed — no user attached</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Record</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid gap-3 sm:grid-cols-2">
                        <Field label="Source" value={company.source} />
                        <Field label="External ID" value={company.externalId} />
                        <Field label="Entity type" value={company.entityType} />
                        <Field label="Legal name" value={company.legalName} />
                        <Field label="DBA" value={company.dbaName} />
                        <Field label="EIN" value={company.ein} />
                        <Field label="Year founded" value={company.yearFounded} />
                        <Field label="Employees" value={company.employeesCount} />
                        <Field label="Created" value={formatDate(company.createdAt)} />
                        <Field label="Updated" value={formatDate(company.updatedAt)} />
                        <Field label="Approved" value={formatDate(company.approvedAt)} />
                        <Field label="Views" value={company.viewed} />
                    </dl>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contacts and area</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid gap-3 sm:grid-cols-2">
                        <Field label="Phone" value={company.phone} />
                        <Field label="Email" value={company.email} />
                        <Field
                            label="Headquarters"
                            value={[
                                company.hqAddressLine1,
                                company.hqCity,
                                company.hqState,
                                company.hqZip,
                            ]
                                .filter(Boolean)
                                .join(", ")}
                        />
                        <Field label="Service city" value={company.sCity} />
                        <Field
                            label="Service ZIPs"
                            value={company.sZips.length > 0 ? company.sZips.join(", ") : "—"}
                        />
                        <Field label="Service area" value={company.sArea} />
                    </dl>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Moderation</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid gap-3 sm:grid-cols-2">
                        <Field
                            label="Catalog visibility"
                            value={company.status ? "Live" : "Hidden"}
                        />
                        <Field label="Moderation status" value={company.moderationStatus} />
                        <Field
                            label="Insured / bonded / licensed"
                            value={[
                                company.isInsured ? "Insured" : null,
                                company.isBonded ? "Bonded" : null,
                                company.isLicensed ? "Licensed" : null,
                            ]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                        />
                        <Field label="Moderation note" value={company.moderationNote} />
                    </dl>
                    {company.description && (
                        <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
                            {company.description}
                        </p>
                    )}
                    {company.status && company.moderationStatus === "approved" && (
                        <AppLink
                            href={`/company/${company.slug}`}
                            className="mt-4 inline-block text-sm underline underline-offset-4"
                        >
                            Open public page
                        </AppLink>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
