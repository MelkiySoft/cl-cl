import { z } from "zod";
import { COMPANY_LINK_TYPES } from "@/lib/company-links";

const emptyToUndef = (v: string | undefined) => (v === "" ? undefined : v);

const hhmm = z
    .string()
    .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");

export const companyHourSlotSchema = z.object({
    weekday: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    openTime: hhmm,
    closeTime: hhmm,
    sortOrder: z.number().int().min(0),
});

export const companyLinkInputSchema = z.object({
    type: z.enum(COMPANY_LINK_TYPES),
    url: z.union([z.literal(""), z.url("Invalid URL")]),
});

export const companyAttributeInputSchema = z.object({
    attributeId: z.number().int().positive(),
    booleanValue: z.boolean().nullable(),
    numberValue: z.number().int().nullable(),
    valueIds: z.array(z.number().int().positive()),
});

export const BUSINESS_STRUCTURES = [
    "sole_proprietorship",
    "llc",
    "corporation",
    "partnership",
    "other",
] as const;

export const BUSINESS_STRUCTURE_LABELS: Record<
    (typeof BUSINESS_STRUCTURES)[number],
    string
> = {
    sole_proprietorship: "Sole proprietorship",
    llc: "LLC",
    corporation: "Corporation",
    partnership: "Partnership",
    other: "Other",
};

const CURRENT_YEAR = new Date().getFullYear();

function optionalInt(min: number, max: number, message: string) {
    return z
        .union([z.number(), z.string(), z.null(), z.undefined()])
        .transform((value) => {
            if (value === "" || value === null || value === undefined) return null;
            const parsed = typeof value === "number" ? value : Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        })
        .refine(
            (value) =>
                value === null ||
                (Number.isInteger(value) && value >= min && value <= max),
            message
        );
}

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
        .transform(emptyToUndef),
    entityType: z.enum(["company", "individual"]),
    ein: z
        .string()
        .max(20)
        .optional()
        .transform(emptyToUndef),
    description: z
        .string()
        .max(5000)
        .optional()
        .transform(emptyToUndef),
    phone: z
        .string()
        .max(30)
        .optional()
        .transform(emptyToUndef),
    email: z
        .union([z.literal(""), z.email("Invalid email")])
        .optional()
        .transform((v) => (v === "" || v === undefined ? undefined : v)),
};

// --- Create ---
export const companyCreateSchema = z.object({
    ...baseCompanyFields,
});
export type CompanyCreateValues = z.input<typeof companyCreateSchema>;

export const companyFormSchema = z
    .object({
        id: z.number(),
        ...baseCompanyFields,
        image: z
            .string()
            .optional()
            .transform(emptyToUndef),
        mainCategoryId: z.number().nullable(),
        extraCategoryId1: z.number().nullable(),
        extraCategoryId2: z.number().nullable(),
        yearFounded: optionalInt(
            1800,
            CURRENT_YEAR,
            `Year founded must be between 1800 and ${CURRENT_YEAR}`
        ),
        employeesCount: optionalInt(
            1,
            10000,
            "Team size must be between 1 and 10000"
        ),
        businessStructure: z.preprocess(
            (value) => (value === "" || value === undefined ? null : value),
            z.enum(BUSINESS_STRUCTURES).nullable()
        ),
        hqAddressLine1: z.string().max(160).optional().transform(emptyToUndef),
        hqCity: z.string().max(80).optional().transform(emptyToUndef),
        hqState: z
            .string()
            .max(2)
            .optional()
            .transform((v) => {
                const s = emptyToUndef(v)
                return s ? s.toUpperCase() : undefined
            }),
        hqZip: z
            .string()
            .optional()
            .transform((v) => {
                const digits = v?.replace(/\D/g, "") ?? ""
                return digits.length >= 5 ? digits.slice(0, 5) : undefined
            }),
        sCity: z
            .string()
            .trim()
            .min(3, "Select a service city")
            .regex(/^.+\s+[A-Za-z]{2}$/, "Use format: Chicago IL"),
        sZips: z
            .array(z.string().regex(/^\d{5}$/, "ZIP must be 5 digits"))
            .min(1, "Add at least one service ZIP"),
        sArea: z.string().max(2000).optional().transform(emptyToUndef),
        hoursMode: z.enum(["weekly", "always_open", "by_appointment"]),
        hoursNote: z
            .string()
            .max(500)
            .optional()
            .transform(emptyToUndef),
        hours: z.array(companyHourSlotSchema),
        links: z.array(companyLinkInputSchema),
        attributes: z.array(companyAttributeInputSchema),
    })
    .superRefine((data, ctx) => {
        const seen = new Set<string>();
        data.links.forEach((link, index) => {
            if (!link.url) return;
            if (seen.has(link.type)) {
                ctx.addIssue({
                    code: "custom",
                    message: "This link type is already used",
                    path: ["links", index, "type"],
                });
            }
            seen.add(link.type);
        });

        if (data.hoursMode !== "weekly") return;

        data.hours.forEach((slot, index) => {
            if (slot.isClosed) return;
            if (!slot.openTime || !slot.closeTime) {
                ctx.addIssue({
                    code: "custom",
                    message: "Set opening and closing time, or mark Closed",
                    path: ["hours", index, "openTime"],
                });
            }
        });
    });

export type CompanyFormValues = z.output<typeof companyFormSchema>;
export type CompanyFormInput = z.input<typeof companyFormSchema>;
