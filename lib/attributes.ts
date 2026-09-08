import type { AttributeType } from "@/db/schema";

/**
 * Стабильные id справочника. Сид вставляет те же значения явно.
 * Не использовать serial «как получится» в коде фильтров и импорта.
 */
export const ATTRIBUTE_ID = {
    languages: 1,
    paymentMethods: 2,
    ecoFriendlyProducts: 3,
    sameDayBooking: 4,
    franchiseAffiliation: 5,
    serviceGuarantee: 6,
    cancellationPolicy: 7,
    owned: 8,
} as const;

export type AttributeId = (typeof ATTRIBUTE_ID)[keyof typeof ATTRIBUTE_ID];

export const ATTRIBUTE_VALUE_ID = {
    // Languages (1)
    english: 1,
    spanish: 2,
    polish: 3,
    aslProficient: 4,
    ukrainian: 5,
    italian: 6,

    // Payment methods (2)
    cash: 11,
    creditCard: 12,
    check: 13,
    zelle: 14,
    venmo: 15,
    payPal: 16,
    applePay: 17,
    googlePay: 18,
    cryptocurrency: 19,
    samsungPay: 20,

    // Cancellation policy (7)
    notice24h: 31,
    notice48h: 32,
    notice72h: 33,

    // Owned (8)
    women: 41,
    family: 42,
    latinx: 43,
    asian: 44,
    black: 45,
    veteran: 46,
    lgbtq: 47,
    locally: 48,
    disabled: 49,
    indigenous: 50,
    minority: 51,
} as const;

export type AttributeValueId =
    (typeof ATTRIBUTE_VALUE_ID)[keyof typeof ATTRIBUTE_VALUE_ID];

export type AttributeSeed = {
    id: AttributeId;
    name: string;
    type: AttributeType;
    filterable: boolean;
    sortOrder: number;
};

export type AttributeValueSeed = {
    id: AttributeValueId;
    attributeId: AttributeId;
    name: string;
    sortOrder: number;
};

export const ATTRIBUTE_SEEDS: AttributeSeed[] = [
    {
        id: ATTRIBUTE_ID.languages,
        name: "Languages",
        type: "multiselect",
        filterable: true,
        sortOrder: 10,
    },
    {
        id: ATTRIBUTE_ID.paymentMethods,
        name: "Payment methods",
        type: "multiselect",
        filterable: true,
        sortOrder: 20,
    },
    {
        id: ATTRIBUTE_ID.ecoFriendlyProducts,
        name: "Eco-friendly products",
        type: "boolean",
        filterable: true,
        sortOrder: 30,
    },
    {
        id: ATTRIBUTE_ID.sameDayBooking,
        name: "Same-day booking",
        type: "boolean",
        filterable: true,
        sortOrder: 40,
    },
    {
        id: ATTRIBUTE_ID.franchiseAffiliation,
        name: "Franchise affiliation",
        type: "boolean",
        filterable: true,
        sortOrder: 50,
    },
    {
        id: ATTRIBUTE_ID.serviceGuarantee,
        name: "Service guarantee",
        type: "boolean",
        filterable: true,
        sortOrder: 60,
    },
    {
        id: ATTRIBUTE_ID.cancellationPolicy,
        name: "Cancellation policy",
        type: "select",
        filterable: false,
        sortOrder: 70,
    },
    {
        id: ATTRIBUTE_ID.owned,
        name: "Owned",
        type: "multiselect",
        filterable: true,
        sortOrder: 80,
    },
];

export const ATTRIBUTE_VALUE_SEEDS: AttributeValueSeed[] = [
    {
        id: ATTRIBUTE_VALUE_ID.english,
        attributeId: ATTRIBUTE_ID.languages,
        name: "English",
        sortOrder: 1,
    },
    {
        id: ATTRIBUTE_VALUE_ID.spanish,
        attributeId: ATTRIBUTE_ID.languages,
        name: "Spanish",
        sortOrder: 2,
    },
    {
        id: ATTRIBUTE_VALUE_ID.polish,
        attributeId: ATTRIBUTE_ID.languages,
        name: "Polish",
        sortOrder: 3,
    },
    {
        id: ATTRIBUTE_VALUE_ID.aslProficient,
        attributeId: ATTRIBUTE_ID.languages,
        name: "ASL proficient",
        sortOrder: 4,
    },
    {
        id: ATTRIBUTE_VALUE_ID.ukrainian,
        attributeId: ATTRIBUTE_ID.languages,
        name: "Ukrainian",
        sortOrder: 5,
    },
    {
        id: ATTRIBUTE_VALUE_ID.italian,
        attributeId: ATTRIBUTE_ID.languages,
        name: "Italian",
        sortOrder: 6,
    },

    {
        id: ATTRIBUTE_VALUE_ID.cash,
        attributeId: ATTRIBUTE_ID.paymentMethods,
        name: "Cash",
        sortOrder: 1,
    },
    {
        id: ATTRIBUTE_VALUE_ID.creditCard,
        attributeId: ATTRIBUTE_ID.paymentMethods,
        name: "Credit Card",
        sortOrder: 2,
    },
    {
        id: ATTRIBUTE_VALUE_ID.check,
        attributeId: ATTRIBUTE_ID.paymentMethods,
        name: "Check",
        sortOrder: 3,
    },
    {
        id: ATTRIBUTE_VALUE_ID.zelle,
        attributeId: ATTRIBUTE_ID.paymentMethods,
        name: "Zelle",
        sortOrder: 4,
    },
    {
        id: ATTRIBUTE_VALUE_ID.venmo,
        attributeId: ATTRIBUTE_ID.paymentMethods,
        name: "Venmo",
        sortOrder: 5,
    },
    {
        id: ATTRIBUTE_VALUE_ID.payPal,
        attributeId: ATTRIBUTE_ID.paymentMethods,
        name: "PayPal",
        sortOrder: 6,
    },
    {
        id: ATTRIBUTE_VALUE_ID.applePay,
        attributeId: ATTRIBUTE_ID.paymentMethods,
        name: "Apple Pay",
        sortOrder: 7,
    },
    {
        id: ATTRIBUTE_VALUE_ID.googlePay,
        attributeId: ATTRIBUTE_ID.paymentMethods,
        name: "Google Pay",
        sortOrder: 8,
    },
    {
        id: ATTRIBUTE_VALUE_ID.cryptocurrency,
        attributeId: ATTRIBUTE_ID.paymentMethods,
        name: "Cryptocurrency",
        sortOrder: 9,
    },
    {
        id: ATTRIBUTE_VALUE_ID.samsungPay,
        attributeId: ATTRIBUTE_ID.paymentMethods,
        name: "Samsung Pay",
        sortOrder: 10,
    },

    {
        id: ATTRIBUTE_VALUE_ID.notice24h,
        attributeId: ATTRIBUTE_ID.cancellationPolicy,
        name: "24-hour notice required",
        sortOrder: 1,
    },
    {
        id: ATTRIBUTE_VALUE_ID.notice48h,
        attributeId: ATTRIBUTE_ID.cancellationPolicy,
        name: "48-hour notice required",
        sortOrder: 2,
    },
    {
        id: ATTRIBUTE_VALUE_ID.notice72h,
        attributeId: ATTRIBUTE_ID.cancellationPolicy,
        name: "72-hour notice required",
        sortOrder: 3,
    },

    {
        id: ATTRIBUTE_VALUE_ID.women,
        attributeId: ATTRIBUTE_ID.owned,
        name: "Women",
        sortOrder: 1,
    },
    {
        id: ATTRIBUTE_VALUE_ID.family,
        attributeId: ATTRIBUTE_ID.owned,
        name: "Family",
        sortOrder: 2,
    },
    {
        id: ATTRIBUTE_VALUE_ID.latinx,
        attributeId: ATTRIBUTE_ID.owned,
        name: "Latinx",
        sortOrder: 3,
    },
    {
        id: ATTRIBUTE_VALUE_ID.asian,
        attributeId: ATTRIBUTE_ID.owned,
        name: "Asian",
        sortOrder: 4,
    },
    {
        id: ATTRIBUTE_VALUE_ID.black,
        attributeId: ATTRIBUTE_ID.owned,
        name: "Black",
        sortOrder: 5,
    },
    {
        id: ATTRIBUTE_VALUE_ID.veteran,
        attributeId: ATTRIBUTE_ID.owned,
        name: "Veteran",
        sortOrder: 6,
    },
    {
        id: ATTRIBUTE_VALUE_ID.lgbtq,
        attributeId: ATTRIBUTE_ID.owned,
        name: "LGBTQ",
        sortOrder: 7,
    },
    {
        id: ATTRIBUTE_VALUE_ID.locally,
        attributeId: ATTRIBUTE_ID.owned,
        name: "Locally",
        sortOrder: 8,
    },
    {
        id: ATTRIBUTE_VALUE_ID.disabled,
        attributeId: ATTRIBUTE_ID.owned,
        name: "Disabled",
        sortOrder: 9,
    },
    {
        id: ATTRIBUTE_VALUE_ID.indigenous,
        attributeId: ATTRIBUTE_ID.owned,
        name: "Indigenous",
        sortOrder: 10,
    },
    {
        id: ATTRIBUTE_VALUE_ID.minority,
        attributeId: ATTRIBUTE_ID.owned,
        name: "Minority",
        sortOrder: 11,
    },
];
