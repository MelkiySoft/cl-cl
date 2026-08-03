# Структура проекта cl-cl

> Автоматически сгенерировано скриптом `scripts/generate-structure.js`
> 
> Последнее обновление: 2026-08-03T12:10:51.192Z

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
│   │   └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
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
│   └── ui/
│       ├── button.tsx
│       └── card.tsx
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
│   ├── r2.ts
│   └── utils.ts
├── logs/
│   └── verification.log
├── public/
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
