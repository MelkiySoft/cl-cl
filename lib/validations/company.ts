import { z } from "zod";

// --- Общие поля ---
const baseCompanyFields = {
    name: z
        .string()
        .min(2, "Display name must be at least 2 characters")
        .max(120, "Display name is too long"),
    legalName: z
        .string()
        .min(2, "Legal name must be at least 2 characters")
        .max(160, "Legal name is too long"),
    dbaName: z
        .string()
        .max(160)
        .optional()
        .transform((v) => (v === "" ? undefined : v)),
    entityType: z.enum(["company", "individual"]),
    description: z
        .string()
        .max(5000)
        .optional()
        .transform((v) => (v === "" ? undefined : v)),
    phone: z
        .string()
        .max(30)
        .optional()
        .transform((v) => (v === "" ? undefined : v)),
    email: z
        .union([z.literal(""), z.email("Invalid email")])
        .optional()
        .transform((v) => (v === "" || v === undefined ? undefined : v)),
    website: z
        .union([z.literal(""), z.url("Invalid URL")])
        .optional()
        .transform((v) => (v === "" || v === undefined ? undefined : v)),
};

// --- Create ---
export const companyCreateSchema = z.object({
    ...baseCompanyFields,
});
export type CompanyCreateValues = z.input<typeof companyCreateSchema>;


export const companyFormSchema = z.object({
    id: z.number(),
    ...baseCompanyFields,
    image: z
        .string()
        .optional()
        .transform((v) => (v === "" ? undefined : v)),
    mainCategoryId: z.number().nullable(),
    extraCategoryId1: z.number().nullable(),
    extraCategoryId2: z.number().nullable(),
});
export type CompanyFormValues = z.input<typeof companyFormSchema>;