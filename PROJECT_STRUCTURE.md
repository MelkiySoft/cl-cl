# Структура проекта cl-cl

> Автоматически сгенерировано скриптом `scripts/generate-structure.js`
> 
> Последнее обновление: 2026-08-19T12:44:54.566Z

```bash
├── actions/
│   ├── account.ts
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
│   │   └── auth/
│   │       └── [...nextauth]/
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
│   │   ├── customer/
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── nav-config.ts
│   │   │   └── sidebar.tsx
│   │   └── provider/
│   │       ├── company-categories-fields.tsx
│   │       ├── company-documents.tsx
│   │       ├── company-gallery.tsx
│   │       ├── create-company-form.tsx
│   │       └── edit-company-form.tsx
│   ├── site/
│   │   ├── blog/
│   │   │   ├── article-card.tsx
│   │   │   ├── article-grid.tsx
│   │   │   ├── blog-category-sidebar.tsx
│   │   │   └── blog-toolbar.tsx
│   │   ├── catalog/
│   │   │   ├── catalog-pagination.tsx
│   │   │   ├── catalog-toolbar.tsx
│   │   │   ├── category-sidebar.tsx
│   │   │   ├── company-card.tsx
│   │   │   └── company-grid.tsx
│   │   ├── company/
│   │   │   ├── company-gallery.tsx
│   │   │   ├── company-map-loader.tsx
│   │   │   └── company-map.tsx
│   │   ├── forms/
│   │   ├── layout/
│   │   │   ├── catalog-menu.tsx
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
│   └── geo/
│       ├── tl_2025_us_zcta520.csv
│       ├── uscities.csv
│       └── zips.json
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
├── lib/
│   ├── validations/
│   │   └── company.ts
│   ├── articles.ts
│   ├── auth.ts
│   ├── blog-categories.ts
│   ├── categories.ts
│   ├── companies.ts
│   ├── provider-categories.ts
│   ├── r2.ts
│   └── utils.ts
├── logs/
│   └── verification.log
├── public/
│   ├── demo/
│   │   ├── article1.jpg
│   │   ├── article2.jpg
│   │   ├── article3.jpg
│   │   ├── category.jpg
│   │   ├── company1.jpg
│   │   ├── company2.jpg
│   │   ├── company3.jpg
│   │   ├── gallery1.jpg
│   │   ├── gallery2.jpg
│   │   ├── gallery3.jpg
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
│   │   ├── export-to-xml.ts
│   │   ├── generate-slugs.ts
│   │   └── load-geo-usa.ts
│   ├── seed/
│   │   ├── articles.ts
│   │   ├── blog-categories.ts
│   │   ├── categories.ts
│   │   ├── companies.ts
│   │   └── users.ts
│   ├── cleanup-r2-orphans.ts
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
