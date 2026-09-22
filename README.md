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

## Для ИИ

Установленные ранее пакеты
https://github.com/MelkiySoft/cl-cl/blob/main/package.json

Структура проекта
https://github.com/MelkiySoft/cl-cl/blob/main/PROJECT_STRUCTURE.md

Структура таблиц (схема)
https://github.com/MelkiySoft/cl-cl/blob/main/db/schema.ts

## работа с geo
1. Положить файлы uscities.csv, zips.json, tl_2025_us_zcta520.csv в data/geo/. Имена/версии — в FILES внутри scripts/geo/load-geo-usa.ts
2. pnpm db:geo:load              # сырой справочник ZIP → geo_usa
3. pnpm db:geo:generate-slugs    # slug на строках geo_usa (для XML-экспорта)
4. pnpm db:geo:build-cities      # рабочая сущность cities + city_zips
5. pnpm db:geo:export-to-xml     # exports/geo_usa_full.xml

`geo_usa` — справочник загрузки. Сайт в рантайме читает `cities` / `city_zips`.
Витрина каталога: `cities.is_public = true`. Стартовый набор (Jacksonville FL, Orlando FL) включается скриптом сборки и не сбрасывается при повторном запуске.

`pnpm db:reset` / `pnpm db:seed` не трогают `geo_usa`, `cities`, `city_zips`.
