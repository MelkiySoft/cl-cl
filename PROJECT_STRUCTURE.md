# Структура проекта cl-cl

> Автоматически сгенерировано скриптом `scripts/generate-structure.js`
> 
> Последнее обновление: 2026-09-24T05:39:25.174Z

```text
├── actions/
│   ├── account.ts
│   ├── admin-companies.ts
│   ├── admin-users.ts
│   ├── auth.ts
│   ├── provider-company.ts
│   └── upload.ts
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── login-form.tsx
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── account/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   ├── companies/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── customer/
│   │   │   └── page.tsx
│   │   ├── provider/
│   │   │   ├── company/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (public)/
│   │   ├── article/
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── blog/
│   │   │   └── [[...path]]/
│   │   │       └── page.tsx
│   │   ├── catalog/
│   │   │   ├── [[...path]]/
│   │   │   │   └── page.tsx
│   │   │   └── filter/
│   │   │       └── [[...path]]/
│   │   │           └── page.tsx
│   │   ├── company/
│   │   │   ├── [slug]/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   └── geo/
│   │       ├── cities/
│   │       │   └── route.ts
│   │       ├── public-cities/
│   │       │   └── route.ts
│   │       ├── suggest/
│   │       │   └── route.ts
│   │       ├── zip/
│   │       │   └── route.ts
│   │       └── zips/
│   │           └── route.ts
│   ├── 111page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   │   ├── account/
│   │   │   └── account-form.tsx
│   │   ├── admin/
│   │   │   ├── company-admin-categories-fields.tsx
│   │   │   ├── company-moderation-form.tsx
│   │   │   ├── company-owner-form.tsx
│   │   │   └── status-badge.tsx
│   │   ├── customer/
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── nav-config.ts
│   │   │   └── sidebar.tsx
│   │   └── provider/
│   │       ├── company-attributes-fields.tsx
│   │       ├── company-categories-fields.tsx
│   │       ├── company-documents.tsx
│   │       ├── company-gallery.tsx
│   │       ├── company-hours-fields.tsx
│   │       ├── company-links-fields.tsx
│   │       ├── company-location-fields.tsx
│   │       ├── create-company-form.tsx
│   │       └── edit-company-form.tsx
│   ├── site/
│   │   ├── blog/
│   │   │   ├── article-card.tsx
│   │   │   ├── article-grid.tsx
│   │   │   ├── blog-category-sidebar.tsx
│   │   │   └── blog-toolbar.tsx
│   │   ├── catalog/
│   │   │   ├── catalog-listing.tsx
│   │   │   ├── catalog-pagination.tsx
│   │   │   ├── catalog-toolbar.tsx
│   │   │   ├── category-sidebar.tsx
│   │   │   ├── company-card.tsx
│   │   │   └── company-grid.tsx
│   │   ├── company/
│   │   │   ├── company-attributes.tsx
│   │   │   ├── company-gallery.tsx
│   │   │   ├── company-hours.tsx
│   │   │   ├── company-map-loader.tsx
│   │   │   └── company-map.tsx
│   │   ├── forms/
│   │   ├── home/
│   │   │   ├── category-slider.tsx
│   │   │   ├── cities-block.tsx
│   │   │   ├── hero-banner.tsx
│   │   │   └── why-choose.tsx
│   │   ├── layout/
│   │   │   ├── catalog-menu.tsx
│   │   │   ├── city-picker.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── header.tsx
│   │   │   ├── logo.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   └── user-nav.tsx
│   │   ├── article-carousel.tsx
│   │   ├── carousel-shell.tsx
│   │   └── company-carousel.tsx
│   ├── ui/
│   │   ├── app-link.tsx
│   │   ├── avatar.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── carousel.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── separator.tsx
│   │   └── sheet.tsx
│   ├── providers.tsx
│   └── theme-provider.tsx
├── config/
├── data/
│   ├── geo/
│   │   ├── tl_2025_us_zcta520.csv
│   │   ├── uscities.csv
│   │   └── zips.json
│   └── import/
│       └── companies/
│           └── companies.xml
├── db/
│   ├── index.ts
│   └── schema.ts
├── drizzle/
│   ├── meta/
│   │   ├── _journal.json
│   │   └── 0000_snapshot.json
│   └── 0000_little_slayback.sql
├── exports/
│   └── geo_usa_full.xml
├── hooks/
│   └── use-selected-city.ts
├── lib/
│   ├── validations/
│   │   └── company.ts
│   ├── admin.ts
│   ├── articles.ts
│   ├── attributes.ts
│   ├── auth.ts
│   ├── blog-categories.ts
│   ├── catalog-path-server.ts
│   ├── catalog-path.ts
│   ├── categories.ts
│   ├── companies.ts
│   ├── company-access.ts
│   ├── company-attributes-db.ts
│   ├── company-attributes.ts
│   ├── company-hours.ts
│   ├── company-links.ts
│   ├── geo.ts
│   ├── provider-categories.ts
│   ├── r2.ts
│   └── utils.ts
├── logs/
│   ├── import-companies.log
│   └── verification.log
├── public/
│   ├── demo/
│   │   ├── category/
│   │   │   ├── air-duct-cleaning.jpg
│   │   │   ├── airbnb-cleaning.jpg
│   │   │   ├── cleaning-outside.jpg
│   │   │   ├── commercial-cleaning.jpg
│   │   │   ├── deep-cleaning.jpg
│   │   │   ├── dry-cleaning.jpg
│   │   │   ├── educational-facility-cleaning.jpg
│   │   │   ├── green-cleaning.jpg
│   │   │   ├── gutter-cleaning.jpg
│   │   │   ├── hoarder-cleaning.jpg
│   │   │   ├── house-cleaning.jpg
│   │   │   ├── industrial-cleaning.jpg
│   │   │   ├── janitorial-cleaning.jpg
│   │   │   ├── junk-removal.jpg
│   │   │   ├── laundry.jpg
│   │   │   ├── maid-service.jpg
│   │   │   ├── medical-facility-cleaning.jpg
│   │   │   ├── mold-remediation.jpg
│   │   │   ├── move-out-in-cleaning.jpg
│   │   │   ├── office-cleaning.jpg
│   │   │   ├── pest-control.jpg
│   │   │   ├── pool-cleaning.jpg
│   │   │   ├── post-construction-cleaning.jpg
│   │   │   ├── pressure-washing.jpg
│   │   │   ├── regular-cleaning.jpg
│   │   │   ├── restaurant-cleaning.jpg
│   │   │   ├── retail-store-cleaning.jpg
│   │   │   ├── sewer-cleaning.jpg
│   │   │   ├── upholstery-cleaning.jpg
│   │   │   ├── vehicle-equipment-cleaning.jpg
│   │   │   └── window-cleaning.jpg
│   │   ├── article1.jpg
│   │   ├── article2.jpg
│   │   ├── article3.jpg
│   │   ├── category.jpg
│   │   ├── company1.jpg
│   │   ├── company2.jpg
│   │   ├── company3.jpg
│   │   ├── company4.jpg
│   │   ├── company5.jpg
│   │   ├── company6.jpg
│   │   ├── company7.jpg
│   │   ├── company8.jpg
│   │   ├── company9.jpg
│   │   ├── gallery1.jpg
│   │   ├── gallery2.jpg
│   │   ├── gallery3.jpg
│   │   ├── gallery4.jpg
│   │   ├── gallery5.jpg
│   │   ├── gallery6.jpg
│   │   ├── gallery7.jpg
│   │   ├── gallery8.jpg
│   │   ├── gallery9.jpg
│   │   ├── hero-banner.jpg
│   │   ├── logo.jpg
│   │   ├── sparkle-1.jpg
│   │   ├── sparkle-2.jpg
│   │   └── user.jpg
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── scripts/
│   ├── geo/
│   │   ├── build-cities.ts
│   │   ├── export-to-xml.ts
│   │   ├── generate-slugs.ts
│   │   └── load-geo-usa.ts
│   ├── import/
│   │   ├── companies-map.ts
│   │   ├── companies-xml-parse.ts
│   │   ├── companies-xml.ts
│   │   ├── companies.ts
│   │   └── import-r2.ts
│   ├── seed/
│   │   ├── articles.ts
│   │   ├── attributes.ts
│   │   ├── blog-categories.ts
│   │   ├── categories.ts
│   │   ├── companies.ts
│   │   └── users.ts
│   ├── cleanup-r2-orphans.ts
│   ├── db-reset.ts
│   ├── db-wipe.ts
│   ├── generate-structure.js
│   └── seed.ts
├── types/
│   └── next-auth.d.ts
├── .env.example
├── .gitignore
├── components.json
├── drizzle.config.ts
├── eslint.config.mjs
├── LICENSE
├── next-env.d.ts
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── PROJECT_STRUCTURE.md
├── proxy.ts
├── README.md
├── tsconfig.json
└── vercel.json
```

---

**Примечание:** node_modules, .git, .next и другие служебные папки исключены.
