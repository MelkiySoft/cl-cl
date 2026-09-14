import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { companies } from "@/db/schema";

type SessionLike = {
    user: {
        id: string;
        role?: string | null;
    };
};

export function companyAccessWhere(companyId: number, session: SessionLike) {
    if (session.user.role === "admin") {
        return eq(companies.id, companyId);
    }

    return and(eq(companies.id, companyId), eq(companies.userId, session.user.id));
}

export function revalidateCompanyPaths(input: {
    companyId: number;
    slug?: string | null;
    ownerId?: string | null;
}) {
    revalidatePath("/provider/company");
    revalidatePath(`/provider/company/${input.companyId}`);
    revalidatePath("/admin/companies");
    revalidatePath(`/admin/companies/${input.companyId}`);

    if (input.slug) {
        revalidatePath(`/company/${input.slug}`);
    }

    if (input.ownerId) {
        revalidatePath(`/admin/users/${input.ownerId}`);
    }
}
