# GBfoods Stock Control

Field and client platform for the GBfoods nationwide depot sorting and segregation programme in Ghana. QC crews capture attendance, stock counts, and photo evidence at distributor depots. Supervisors verify. GBfoods records quality dispositions.

## Built today

- Turborepo monorepo with `apps/web` (Next.js) and `apps/api` (NestJS)
- Biome + Husky pre-commit hooks
- Prisma + PostgreSQL, health endpoint, Swagger
- Auth: field staff ID + PIN, ops/client email + password, sessions, `/auth/me`
- Role shells for field, ops, and GBfoods client
- Network master data: 16 Ghana regions, distributors, depots (optional recce lat/lng), QC assignments
- Ops UI: `/ops/regions`, `/ops/distributors`, `/ops/depots`, `/ops/attendance`
- Field attendance: photo check-in/out with optional GPS (no geofencing), R2 or local uploads
- Field UI: `/field`, `/field/check-in?depotId=…`
- GBfoods brand tokens and logo assets

## Not built yet

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
pnpm --filter @gbfoods/api exec prisma migrate dev --schema prisma/schema.prisma
pnpm --filter @gbfoods/api seed:auth
pnpm --filter @gbfoods/api seed:network
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
| `DATABASE_URL` | `postgresql://portfolio:portfolio@localhost:5436/gbfoods_stock?schema=public` | API |
| `HOST` | `0.0.0.0` | API |
| `PORT` | `4000` | API |
| `CORS_ORIGINS` | `http://localhost:3000` | API |
| `JWT_ACCESS_SECRET` | long random string (32+ chars) | API |
| `JWT_ACCESS_TTL_SECONDS` | `900` | API |
| `JWT_REFRESH_TTL_DAYS` | `14` | API |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000/api/v1` | Web |
| `R2_ACCOUNT_ID` | Cloudflare account id | API (optional locally) |
| `R2_ACCESS_KEY_ID` | R2 API token access key | API (optional locally) |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret | API (optional locally) |
| `R2_BUCKET` | bucket name | API (optional locally) |
| `R2_PUBLIC_BASE_URL` | `https://pub.example.r2.dev` | API (optional locally) |

When all `R2_*` variables are set, attendance photos use presigned PUT uploads to Cloudflare R2. If they are omitted, use `POST /api/v1/uploads/local` (multipart field `file`); files are stored under `apps/api/.uploads` and object keys are prefixed with `local/`.

### Local attendance smoke test (no R2)

```bash
# Sign in as QC (see seed accounts), then:
TOKEN="$(curl -s -X POST http://localhost:4000/api/v1/auth/field/sign-in \
  -H 'Content-Type: application/json' \
  -d '{"staffId":"BTL-0031","pin":"2468"}' | jq -r .accessToken)"

curl -s -X POST http://localhost:4000/api/v1/uploads/local \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/tiny.jpg;type=image/jpeg"

# Use returned objectKey in attendance (replace DEPOT_ID from GET /assignments/me/depots):
curl -s -X POST http://localhost:4000/api/v1/attendance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"depotId":"DEPOT_ID","kind":"check_in","photoObjectKey":"local/….jpg","latitude":5.6,"longitude":-0.2,"accuracyMeters":12}'
```

### Seed accounts

| Role | Login | Secret |
| --- | --- | --- |
| QC | staff ID `BTL-0031` | PIN `2468` |
| Cluster supervisor | staff ID `BTL-0105` | PIN `1357` |
| Admin | `admin@gbfoods.local` | `ChangeMe123!` |
| GBfoods reviewer | `reviewer@gbfoods.local` | `ChangeMe123!` |
| National ops | `ops@gbfoods.local` | `ChangeMe123!` |

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
