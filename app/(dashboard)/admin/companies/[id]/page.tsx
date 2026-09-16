import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";
import {
    getAdminCompanyById,
    getAdminProviderOptions,
} from "@/actions/admin-companies";
import {
    getCompanyAttributesForEdit,
    getCompanyDocuments,
    getCompanyForEdit,
    getCompanyHoursForEdit,
    getCompanyImages,
    getCompanyLinksForEdit,
} from "@/actions/provider-company";
import { CompanyOwnerForm } from "@/components/dashboard/admin/company-owner-form";
import { CompanyModerationForm } from "@/components/dashboard/admin/company-moderation-form";
import {
    CompanyStatusBadge,
    SourceBadge,
} from "@/components/dashboard/admin/status-badge";
import { EditCompanyForm } from "@/components/dashboard/provider/edit-company-form";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    getCompanyLeafSelection,
    getLeafOptions,
} from "@/lib/provider-categories";

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

export default async function AdminCompanyPage({ params }: Props) {
    const { id } = await params;
    const companyId = Number(id);

    if (!companyId || Number.isNaN(companyId)) {
        notFound();
    }

    const [
        adminCompany,
        company,
        images,
        documents,
        leaves,
        categorySelection,
        hours,
        links,
        attributeState,
        providers,
    ] = await Promise.all([
        getAdminCompanyById(companyId),
        getCompanyForEdit(companyId),
        getCompanyImages(companyId),
        getCompanyDocuments(companyId),
        getLeafOptions(),
        getCompanyLeafSelection(companyId),
        getCompanyHoursForEdit(companyId),
        getCompanyLinksForEdit(companyId),
        getCompanyAttributesForEdit(companyId),
        getAdminProviderOptions(),
    ]);

    if (!adminCompany || !company) {
        notFound();
    }

    return (
        <div className="space-y-8 max-w-7xl">
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
                        {adminCompany.name}
                    </h1>
                    <SourceBadge source={adminCompany.source} />
                    <CompanyStatusBadge
                        moderationStatus={adminCompany.moderationStatus}
                        status={adminCompany.status}
                    />
                </div>
                <p className="mt-1 text-muted-foreground">/{adminCompany.slug}</p>
                {adminCompany.status && adminCompany.moderationStatus === "approved" && (
                    <AppLink
                        href={`/company/${adminCompany.slug}`}
                        className="mt-2 inline-block text-sm underline underline-offset-4"
                    >
                        Open public page
                    </AppLink>
                )}
            </div>

            <CompanyOwnerForm
                companyId={companyId}
                claimedAt={adminCompany.claimedAt}
                owner={adminCompany.owner}
                providers={providers}
            />

            <CompanyModerationForm
                companyId={companyId}
                status={adminCompany.status}
                moderationStatus={adminCompany.moderationStatus}
                moderationNote={adminCompany.moderationNote}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Record</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                Source
                            </dt>
                            <dd className="mt-1 capitalize">{adminCompany.source}</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                External ID
                            </dt>
                            <dd className="mt-1 break-all">
                                {adminCompany.externalId || "—"}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                Created
                            </dt>
                            <dd className="mt-1">{formatDate(adminCompany.createdAt)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                                Views
                            </dt>
                            <dd className="mt-1">{adminCompany.viewed}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>

            <EditCompanyForm
                company={company}
                images={images}
                documents={documents}
                leaves={leaves}
                categorySelection={categorySelection}
                hours={hours}
                links={links}
                attributeDefinitions={attributeState.definitions}
                attributeValues={attributeState.values}
                categoriesMode="admin"
            />
        </div>
    );
}
