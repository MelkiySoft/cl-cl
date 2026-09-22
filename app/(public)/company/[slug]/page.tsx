import type { Metadata } from "next"
import { AppLink } from "@/components/ui/app-link"
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
import { CompanyGallery } from "@/components/site/company/company-gallery"
import { getCompanyBySlug } from "@/lib/companies"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CompanyMapLoader } from "@/components/site/company/company-map-loader"
import { CompanyHours } from "@/components/site/company/company-hours"
import { CompanyAttributes } from "@/components/site/company/company-attributes"
import {
    COMPANY_LINK_LABELS,
    displayLinkHost,
    getWebsiteUrl,
    sortCompanyLinks,
} from "@/lib/company-links"
import { buildCatalogPath } from "@/lib/catalog-path"
import { getCoordsByServiceCity, getCoordsByZips, getPublicCityByServiceCity } from "@/lib/geo"

export const revalidate = 60
export const dynamicParams = true

type PageProps = {
    params: Promise<{ slug: string }>
}

/**
 * Не пререндерим все карточки на билде.
 * 4000 компаний × HTML/RSC ≈ 200–300 МБ в deployments-storage на каждый деплой.
 * Страница собирается по первому запросу и дальше живёт как ISR (revalidate).
 */

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
    const location = company.sCity ?? ""
    const city = await getPublicCityByServiceCity(company.sCity)
    const citySlug = city?.slug ?? null
    const cityLabel = city ? `${city.city}, ${city.stateId}` : null
    const zipZones = await getCoordsByZips(company.sZips)
    const coords = zipZones.length > 0
        ? null
        : company.sCity
            ? await getCoordsByServiceCity(company.sCity)
            : null

    const hqAddress = [
        company.hqAddressLine1,
        company.hqCity,
        company.hqState,
        company.hqZip,
    ]
        .filter(Boolean)
        .join(", ")

    // галерея — только фото работ; логотип компании показывается у названия
    const galleryImages = company.images.filter((img) => img.image !== company.image)
    const website = getWebsiteUrl(company.links)
    const otherLinks = sortCompanyLinks(company.links).filter(
        (l) => l.type !== "website"
    )

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">

            {/* Breadcrumbs */}
            <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <AppLink href="/" className="hover:text-foreground transition-colors">
                    Home
                </AppLink>
                <span>/</span>
                <AppLink
                    href="/catalog"
                    className="hover:text-foreground transition-colors"
                >
                    Catalog
                </AppLink>

                {cityLabel && citySlug && (
                    <>
                        <span>/</span>
                        <AppLink
                            href={buildCatalogPath({ citySlug })}
                            className="hover:text-foreground transition-colors"
                        >
                            {cityLabel}
                        </AppLink>
                    </>
                )}

                {(() => {
                    const mainCategory =
                        company.categories.find((c) => c.isMain) ??
                        company.categories[0]

                    if (!mainCategory) return null

                    return mainCategory.path.map((crumb, i) => {
                        const href = buildCatalogPath({
                            citySlug,
                            categorySlugs: mainCategory.path
                                .slice(0, i + 1)
                                .map((c) => c.slug),
                        })

                        return (
                            <span key={crumb.id} className="flex items-center gap-1.5">
                                <span>/</span>
                                <AppLink
                                    href={href}
                                    className="hover:text-foreground transition-colors"
                                >
                                    {crumb.name}
                                </AppLink>
                            </span>
                        )
                    })
                })()}

                <span>/</span>
                <span className="text-foreground font-medium">{company.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ===== Main content ===== */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Title + mini logo + badges */}
                    <div className="flex items-start gap-4">
                        {company.image ? (
                            <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
                                <Image
                                    src={company.image}
                                    alt={`${company.name} logo`}
                                    fill
                                    className="object-contain p-1"
                                    sizes="80px"
                                    priority
                                />
                            </div>
                        ) : null}
                        <div className="min-w-0">
                            <h1 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-5xl md:leading-[3.5rem]">{title}</h1>

                            {location && (
                                <p className="mt-2 flex items-center gap-1.5 text-lg text-muted-foreground">
                                    <MapPin className="size-4 shrink-0" />
                                    {location}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                                {company.isInsured && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-muted text-success px-3 py-1 text-base">
                                        <Shield className="size-3.5" />
                                        Insured
                                    </span>
                                )}
                                {company.isBonded && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-primary px-3 py-1 text-base">
                                        <BadgeCheck className="size-3.5" />
                                        Bonded
                                    </span>
                                )}
                                {company.isLicensed && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-primary px-3 py-1 text-base">
                                        <Award className="size-3.5" />
                                        Licensed
                                    </span>
                                )}
                            </div>
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
                            <h2 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10 mb-3">About</h2>
                            <p className="text-lg text-muted-foreground whitespace-pre-line">
                                {company.description}
                            </p>
                        </section>
                    )}

                    <CompanyHours
                        mode={company.hoursMode}
                        hours={company.hours}
                        note={company.hoursNote}
                    />

                    <CompanyAttributes items={company.attributes} />

                    {/* Details */}
                    <section>
                        <h2 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10 mb-3">Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {company.yearFounded && (
                                <div className="flex items-center gap-2.5 text-lg text-muted-foreground">
                                    <Calendar className="size-4 shrink-0" />
                                    <span>Founded:</span>
                                    <span className="font-bold">{company.yearFounded}</span>
                                </div>
                            )}
                            {company.employeesCount && (
                                <div className="flex items-center gap-2.5 text-lg text-muted-foreground">
                                    <Users className="size-4 shrink-0" />
                                    <span>Team size:</span>
                                    <span className="font-bold">
                                        {company.employeesCount} employees
                                    </span>
                                </div>
                            )}
                            {company.businessStructure && (
                                <div className="flex items-center gap-2.5 text-lg text-muted-foreground">
                                    <Building2 className="size-4 shrink-0" />
                                    <span>Structure:</span>
                                    <span className="font-bold capitalize">
                                        {company.businessStructure.replace(/_/g, " ")}
                                    </span>
                                </div>
                            )}
                            {company.legalName && company.legalName !== company.name && (
                                <div className="flex items-center gap-2.5 text-lg text-muted-foreground">
                                    <Building2 className="size-4 shrink-0" />
                                    <span>Legal name:</span>
                                    <span className="font-bold">{company.legalName}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Categories */}
                    {company.categories.length > 0 && (
                        <section>
                            <h2 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10 mb-3">Services</h2>
                            <div className="flex flex-wrap gap-2">
                                {company.categories.map((cat) => (
                                    <AppLink
                                        key={cat.id}
                                        href={`/catalog/${cat.slug}`}
                                        className="rounded-full border border-border px-3 py-1 text-base text-primary hover:bg-accent hover:border-transparent transition-colors"
                                    >
                                        {cat.name}
                                    </AppLink>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* ===== Sidebar ===== */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-20 rounded-lg p-5 space-y-5">
                        <h2 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10">Contact</h2>

                        <div className="space-y-3 text-lg text-muted-foreground">
                            {company.phone && (
                                <a
                                    href={`tel:${company.phone}`}
                                    className="flex items-center gap-2.5 hover:text-primary transition-colors"
                                >
                                    <Phone className="size-4 shrink-0" />
                                    {company.phone}
                                </a>
                            )}

                            {company.email && (
                                <a
                                    href={`mailto:${company.email}`}
                                    className="flex items-center gap-2.5 hover:text-primary transition-colors"
                                >
                                    <Mail className="size-4 shrink-0" />
                                    {company.email}
                                </a>
                            )}

                            {website && (
                                <a
                                    href={website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 hover:text-primary transition-colors"
                                >
                                    <Globe className="size-4 shrink-0" />
                                    {website.replace(/^https?:\/\//, "")}
                                </a>
                            )}

                            {otherLinks.map((link) => (
                                <a
                                    key={link.type}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2.5 hover:text-primary transition-colors"
                                >
                                    <Globe className="size-4 shrink-0" />
                                    <span>
                                        {COMPANY_LINK_LABELS[link.type]}
                                        <span className="ml-1 text-sm opacity-70">
                                            {displayLinkHost(link.url)}
                                        </span>
                                    </span>
                                </a>
                            ))}

                            {hqAddress && (
                                <div className="flex items-start gap-2.5">
                                    <MapPin className="size-4 shrink-0 mt-0.5" />
                                    <span>{hqAddress}</span>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* CTA — без мессенджера пока */}
                        <div className="space-y-2">
                            <Button
                                className="w-full h-auto rounded-lg bg-primary text-primary-foreground text-2xl font-semibold py-2 hover:bg-primary/90 disabled:opacity-100 disabled:bg-primary disabled:text-primary-foreground"
                                size="lg"
                                disabled
                            >
                                Request a callback
                            </Button>
                            <p className="text-sm text-center text-muted-foreground/40">
                                Messaging coming soon
                            </p>
                        </div>

                        {company.viewed > 0 && (
                            <p className="text-xs text-center text-muted-foreground">
                                {company.viewed} views
                            </p>
                        )}

                        {(company.sCity || company.sZips.length > 0 || company.sArea || zipZones.length > 0 || coords) && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <h3 className="text-[1.75rem] leading-9 font-bold tracking-tight md:text-3xl md:leading-10">Service area</h3>
                                    {company.sCity && (
                                        <p className="text-lg text-muted-foreground">
                                            {company.sCity}
                                        </p>
                                    )}
                                    {company.sZips.length > 0 && (
                                        <p className="text-lg text-muted-foreground">
                                            ZIP: {company.sZips.join(", ")}
                                        </p>
                                    )}
                                    {company.sArea && (
                                        <p className="text-lg text-muted-foreground whitespace-pre-line">
                                            {company.sArea}
                                        </p>
                                    )}
                                    {zipZones.length > 0 ? (
                                        <CompanyMapLoader
                                            zones={zipZones}
                                            radiusMeters={2500}
                                        />
                                    ) : coords ? (
                                        <CompanyMapLoader
                                            latitude={coords.latitude}
                                            longitude={coords.longitude}
                                            radiusMeters={5000}
                                        />
                                    ) : null}
                                </div>
                            </>
                        )}

                    </Card>
                </div>
            </div>
        </div>
    )
}
