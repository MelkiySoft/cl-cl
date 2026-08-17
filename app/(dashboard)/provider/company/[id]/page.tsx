import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
    getCompanyForEdit,
    getCompanyImages,
    getCompanyDocuments,
} from "@/actions/provider-company";
import { EditCompanyForm } from "@/components/dashboard/provider/edit-company-form";
import { CompanyGallery } from "@/components/dashboard/provider/company-gallery";
import {
    getLeafOptions,
    getCompanyLeafSelection,
} from "@/lib/provider-categories";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function EditCompanyPage({ params }: Props) {
    const { id } = await params;
    const companyId = Number(id);

    if (!companyId || Number.isNaN(companyId)) {
        notFound();
    }

    const [company, images, documents, leaves, categorySelection] = await Promise.all([
        getCompanyForEdit(companyId),
        getCompanyImages(companyId),
        getCompanyDocuments(companyId),
        getLeafOptions(),
        getCompanyLeafSelection(companyId),
    ]);

    if (!company) {
        notFound();
    }

    return (
        <div className="space-y-8 max-w-7xl">
            <div>
                <Link
                    href="/provider/company"
                    className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="mr-1 size-4" />
                    Back to companies
                </Link>

                <h1 className="text-2xl font-semibold tracking-tight">
                    Edit company
                </h1>

            </div>

            <EditCompanyForm
                company={company}
                images={images}
                documents={documents}
                leaves={leaves}
                categorySelection={categorySelection}
            />


        </div>
    );
}