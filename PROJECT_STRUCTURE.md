# Структура проекта cl-cl

> Автоматически сгенерировано скриптом `scripts/generate-structure.js`
> 
> Последнее обновление: 2026-08-04T09:03:08.420Z

```bash
├── actions/
│   ├── auth.ts
│   └── upload.ts
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── customer/
│   │   │   └── page.tsx
│   │   ├── provider/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (public)/
│   │   ├── catalog/
│   │   │   └── [...path]/
│   │   │       └── page.tsx
│   │   ├── company/
│   │   │   └── [slug]/
│   │   │       └── page.tsx
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
│   │   ├── admin/
│   │   ├── customer/
│   │   ├── layout/
│   │   └── provider/
│   ├── site/
│   │   ├── catalog/
│   │   ├── company/
│   │   ├── forms/
│   │   └── layout/
│   │       ├── catalog-menu.tsx
│   │       ├── footer.tsx
│   │       ├── header.tsx
│   │       ├── logo.tsx
│   │       ├── mobile-nav.tsx
│   │       ├── theme-toggle.tsx
│   │       └── user-nav.tsx
│   ├── ui/
│   │   ├── avatar.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
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
│   └── 0000_nappy_sprite.sql
├── exports/
│   └── geo_usa_full.xml
├── hooks/
├── lib/
│   ├── auth.ts
│   ├── categories.ts
│   ├── r2.ts
│   └── utils.ts
├── logs/
│   └── verification.log
├── public/
│   ├── demo/
│   │   ├── category.jpg
│   │   ├── company1.jpg
│   │   ├── company2.jpg
│   │   ├── company3.jpg
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
│   │   ├── categories.ts
│   │   ├── companies.ts
│   │   └── users.ts
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
└── tsconfig.json
```

---

**Примечание:** node_modules, .git, .next и другие служебные папки исключены.
