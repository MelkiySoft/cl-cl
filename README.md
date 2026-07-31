# cl-cl

Каталог клининговых компаний в США.

## Роли:
- **Provider** — компания: профиль, модерация, заявки
- **Customer** — пользователь: заявки «на созвон»
- **Admin** — модерация компаний, категории, контент

## Стек (сейчас)
- Next.js 16 (App Router) + React 19
- Tailwind CSS 4 + shadcn/ui
- Drizzle ORM + PostgreSQL
- Auth.js (NextAuth v5) — Credentials, JWT, роли
- pnpm

## Установленные ранее пакеты
https://github.com/MelkiySoft/cl-cl/blob/main/package.json

## Структура проекта
https://github.com/MelkiySoft/cl-cl/blob/main/PROJECT_STRUCTURE.md

## Структура таблиц (схема)
https://github.com/MelkiySoft/cl-cl/blob/main/db/schema.ts

## работа с geo
1. Положить файлы uscities.csv, zips.json, tl_2025_us_zcta520.csv в data/geo/. Иимена/версии — в FILES внутри scripts/geo/load-geo-usa.ts
2. pnpm db:geo:load              # загрузка в БД
3. pnpm db:geo:generate-slugs    # slug для городов
4. pnpm db:geo:export-to-xml     # exports/geo_usa_full.xml