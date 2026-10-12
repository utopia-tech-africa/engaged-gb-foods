# GBfoods Stock Control

Field and client platform for the GBfoods nationwide depot sorting and segregation programme in Ghana. QC crews capture attendance, stock counts, and photo evidence at distributor depots. Supervisors verify. GBfoods records quality dispositions.

## Built today

- Turborepo monorepo with `apps/web` (Next.js) and `apps/api` (NestJS)
- Biome + Husky pre-commit hooks
- Prisma + PostgreSQL stub and health endpoint with Swagger
- GBfoods brand tokens and logo assets on the landing page

## Not built yet

- Auth and roles
- Regions, distributors, depots
- Attendance with location
- Stock capture, reconciliation, and client control room

See `PRD.md` for the full product definition.

## Prerequisites

- Node.js 22+
- pnpm 10.8.0
- PostgreSQL 16+ (local or Docker)

## Setup

```bash
pnpm install
cp apps/api/.env.keep apps/api/.env
# edit DATABASE_URL and other vars in apps/api/.env
cp apps/web/.env.keep apps/web/.env.local
pnpm --filter @gbfoods/api prisma:generate
pnpm --filter @gbfoods/api exec prisma migrate dev --name init --schema prisma/schema.prisma
```

## Run

```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/api/v1/docs

## Lint and typecheck

```bash
pnpm lint
pnpm lint:fix
pnpm typecheck
```

## Environment variables

Documented here instead of an `.env.example` file. Copy from the `.env.keep` stubs.

| Name | Example | App |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/gbfoods_stock?schema=public` | API |
| `HOST` | `0.0.0.0` | API |
| `PORT` | `4000` | API |
| `CORS_ORIGINS` | `http://localhost:3000` | API |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000/api/v1` | Web |

R2 upload credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL`) and auth secrets land with those features.

## Layout

```
apps/
  api/     NestJS + Prisma + Swagger
  web/     Next.js App Router + Tailwind v4 + Orval
PRD.md     Product requirements
```

## Brand

- Orange `#fe5000`, ink grey `#54585a`
- Logo: `apps/web/public/logo-ghana.png`
- Favicon: `apps/web/public/favicon.svg`
