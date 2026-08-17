import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateCompanyForm } from "@/components/dashboard/provider/create-company-form";

export default function NewCompanyPage() {
    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <Link
                    href="/provider/company"
                    className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="mr-1 size-4" />
                    Back to companies
                </Link>

                <h1 className="text-2xl font-semibold tracking-tight">
                    New company
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Fill in the basic info. You can add a logo and more details
                    after creation.
                </p>
            </div>

            <CreateCompanyForm />
        </div>
    );
}