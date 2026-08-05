import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/layout/header";
import { DashboardSidebar } from "@/components/dashboard/layout/sidebar";
import type { UserRole } from "@/db/schema";

export default async function DashboardLayout({
                                                  children,
                                              }: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const user = {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role as UserRole,
    };

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">

            <DashboardSidebar role={user.role} />

            <div className="flex flex-1 flex-col">
                <DashboardHeader user={user} />

                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}