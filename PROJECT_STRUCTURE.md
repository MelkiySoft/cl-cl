# Структура проекта cl-cl

> Автоматически сгенерировано скриптом `scripts/generate-structure.js`
> 
> Последнее обновление: 2026-07-27T13:59:26.543Z

```bash
├── actions/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
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
├── db/
│   ├── index.ts
│   └── schema.ts
├── drizzle/
│   ├── meta/
│   │   ├── _journal.json
│   │   └── 0000_snapshot.json
│   └── 0000_silly_bedlam.sql
├── hooks/
├── lib/
│   └── utils.ts
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── scripts/
│   └── generate-structure.js
├── types/
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
├── README.md
└── tsconfig.json
```

---

**Примечание:** node_modules, .git, .next и другие служебные папки исключены.
