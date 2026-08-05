import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountForm } from "@/components/dashboard/account/account-form";

export default async function AccountPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
                <p className="mt-1 text-muted-foreground">
                    Manage your profile information
                </p>
            </div>

            <AccountForm
                user={{
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email,
                    image: session.user.image,
                }}
            />
        </div>
    );
}