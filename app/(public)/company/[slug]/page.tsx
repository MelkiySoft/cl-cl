import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import {
    MapPin,
    Phone,
    Mail,
    Globe,
    Shield,
    BadgeCheck,
    Award,
    Users,
    Calendar,
    Building2,
} from "lucide-react"
import { and, eq } from "drizzle-orm"
import { CompanyGallery } from "@/components/site/company/company-gallery"
import { getCompanyBySlug } from "@/lib/companies"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CompanyMapLoader } from "@/components/site/company/company-map-loader"
import { db } from "@/db"
import { companies } from "@/db/schema"

export const revalidate = 3600 // 1 час

type PageProps = {
    params: Promise<{ slug: string }>
}

/* Кеширование от CDN vercel.  x-vercel-cache: HIT */
export async function generateStaticParams() {
    const rows = await db.query.companies.findMany({
        where: and(
            eq(companies.status, true),
            eq(companies.moderationStatus, "approved")
        ),
        columns: { slug: true },
    })

    return rows.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
                                           params,
                                       }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const company = await getCompanyBySlug(slug)

    if (!company) {
        return { title: "Company not found" }
    }

    return {
        title: company.metaTitle || `${company.name} — Cleaning Company`,
        description:
            company.metaDescription ||
            company.description ||
            `Contact ${company.name} for professional cleaning services`,
    }
}

export default async function CompanyPage({ params }: PageProps) {
    const { slug } = await params
    const company = await getCompanyBySlug(slug)

    if (!company) {
        notFound()
    }

    const title = company.metaH1 || company.name
    const location = [company.city, company.state].filter(Boolean).join(", ")
    const fullAddress = [
        company.addressLine1,
        company.addressLine2,
        company.city,
        company.state,
        company.zip,
    ]
        .filter(Boolean)
        .join(", ")

    // галерея: главное фото + дополнительные (без дублей)
    const galleryImages = [
        ...(company.image ? [{ id: 0, image: company.image, sortOrder: -1 }] : []),
        ...company.images.filter((img) => img.image !== company.image),
    ]

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            {/* Breadcrumbs */}
            <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                    Home
                </Link>
                <span>/</span>
                <Link
                    href="/catalog"
                    className="hover:text-foreground transition-colors"
                >
                    Catalog
                </Link>
                {company.categories[0] && (
                    <>
                        <span>/</span>
                        <Link
                            href={`/catalog/${company.categories[0].slug}`}
                            className="hover:text-foreground transition-colors"
                        >
                            {company.categories[0].name}
                        </Link>
                    </>
                )}
                <span>/</span>
                <span className="text-foreground font-medium">{company.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ===== Main content ===== */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Title + badges */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>

                        {location && (
                            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="size-4 shrink-0" />
                                {location}
                            </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                            {company.isInsured && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 text-xs font-medium">
                  <Shield className="size-3.5" />
                  Insured
                </span>
                            )}
                            {company.isBonded && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1 text-xs font-medium">
                  <BadgeCheck className="size-3.5" />
                  Bonded
                </span>
                            )}
                            {company.isLicensed && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 px-3 py-1 text-xs font-medium">
                  <Award className="size-3.5" />
                  Licensed
                </span>
                            )}
                        </div>
                    </div>

                    {/* Gallery */}
                    <CompanyGallery
                        images={galleryImages}
                        companyName={company.name}
                    />

                    {/* Description */}
                    {company.description && (
                        <section>
                            <h2 className="text-lg font-semibold mb-3">About</h2>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                {company.description}
                            </p>
                        </section>
                    )}

                    {/* Details */}
                    <section>
                        <h2 className="text-lg font-semibold mb-3">Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {company.yearFounded && (
                                <div className="flex items-center gap-2.5 text-sm">
                                    <Calendar className="size-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">Founded:</span>
                                    <span className="font-medium">{company.yearFounded}</span>
                                </div>
                            )}
                            {company.employeesCount && (
                                <div className="flex items-center gap-2.5 text-sm">
                                    <Users className="size-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">Team size:</span>
                                    <span className="font-medium">
                    {company.employeesCount} employees
                  </span>
                                </div>
                            )}
                            {company.businessStructure && (
                                <div className="flex items-center gap-2.5 text-sm">
                                    <Building2 className="size-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">Structure:</span>
                                    <span className="font-medium capitalize">
                    {company.businessStructure.replace(/_/g, " ")}
                  </span>
                                </div>
                            )}
                            {company.legalName && company.legalName !== company.name && (
                                <div className="flex items-center gap-2.5 text-sm">
                                    <Building2 className="size-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground">Legal name:</span>
                                    <span className="font-medium">{company.legalName}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Categories */}
                    {company.categories.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold mb-3">Services</h2>
                            <div className="flex flex-wrap gap-2">
                                {company.categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/catalog/${cat.slug}`}
                                        className="rounded-full border px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* ===== Sidebar ===== */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-20 p-5 space-y-5">
                        <h2 className="font-semibold text-lg">Contact</h2>

                        <div className="space-y-3 text-sm">
                            {company.phone && (
                                <a
                                    href={`tel:${company.phone}`}
                                    className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Phone className="size-4 shrink-0" />
                                    {company.phone}
                                </a>
                            )}

                            {company.email && (
                                <a
                                    href={`mailto:${company.email}`}
                                    className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Mail className="size-4 shrink-0" />
                                    {company.email}
                                </a>
                            )}

                            {company.website && (
                                <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Globe className="size-4 shrink-0" />
                                    {company.website.replace(/^https?:\/\//, "")}
                                </a>
                            )}

                            {fullAddress && (
                                <div className="flex items-start gap-2.5 text-muted-foreground">
                                    <MapPin className="size-4 shrink-0 mt-0.5" />
                                    <span>{fullAddress}</span>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* CTA — без мессенджера пока */}
                        <div className="space-y-2">
                            <Button className="w-full" size="lg" disabled>
                                Request a callback
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                Messaging coming soon
                            </p>
                        </div>

                        {company.viewed > 0 && (
                            <p className="text-xs text-center text-muted-foreground">
                                {company.viewed} views
                            </p>
                        )}

                        {company.latitude && company.longitude && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold text-sm mb-2">Service area</h3>
                                    <CompanyMapLoader
                                        latitude={company.latitude}
                                        longitude={company.longitude}
                                        radiusMeters={5000}
                                    />
                                </div>
                            </>
                        )}

                    </Card>
                </div>
            </div>
        </div>
    )
}