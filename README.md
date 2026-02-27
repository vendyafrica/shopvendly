# Shopvendly Monorepo

> Modern commerce OS for African social sellers. This repository hosts every surface - customer storefront, merchant workspace, and automation APIs - built on a shared design system and database layer.

## Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Running the apps](#running-the-apps)
- [Environment configuration](#environment-configuration)
- [Common workflows](#common-workflows)
- [Deployment notes](#deployment-notes)
- [Contributing](#contributing)

## Architecture

```
apps/
├─ web/    → Customer + merchant-facing Next.js experience
├─ admin/  → Internal Next.js control panel (port 3001)
└─ api/    → Express + tRPC edge API for automations & webhooks

packages/
├─ auth/             → Better Auth wrapper + session helpers
├─ db/               → Drizzle schema, Neon/Postgres adapters, seeds
├─ transactional/    → React Email templates + Resend wiring
├─ ui/               → Shared design system (Base UI, Tailwind, CVA)
└─ eslint-config/    → Central linting presets
```

Turbo keeps builds, lint, and type-check tasks in sync across the monorepo while pnpm workspaces provide dependency hoisting.

## Tech Stack

- **Runtime:** Node 18+, TypeScript everywhere
- **UI:** Next.js 16, React 19, Tailwind, Base UI primitives, Framer Motion
- **State/data:** TanStack Query/Form/Table, TRPC, Zod
- **Infra:** Neon/Postgres via Drizzle ORM, Upstash Redis/QStash, UploadThing, Resend
- **Auth:** Better Auth with workspace-specific helpers
- **Observability:** Sentry, PostHog analytics + speed insights

## Getting Started

Prerequisites: Node ≥18, pnpm 9, Git, and access to all required third-party keys.

1. **Install dependencies**

```sh
pnpm install
```

2. **Bootstrap environment variables**

```sh
cp .env.example .env
```

Fill in the `.env` with credentials for your database, auth providers, WhatsApp, MTN MoMo, Paystack, UploadThing, Resend, etc.

3. **Generate database artifacts (optional first run)**

```sh
pnpm --filter @shopvendly/db generate
pnpm --filter @shopvendly/db push
pnpm --filter @shopvendly/db seed
```

## Running the apps

Use Turbo to fan out tasks or target each workspace individually.

```sh
# run every app in watch mode
pnpm dev

# run one target
pnpm turbo run dev --filter=@shopvendly/web
pnpm turbo run dev --filter=@shopvendly/admin
pnpm turbo run dev --filter=@shopvendly/api
```

When running individually:

- Web app listens on **http://localhost:3000**
- Admin app listens on **http://localhost:3001**
- API server uses `tsx watch` with the shared `.env`

Build & type-check:

```sh
pnpm build          # turbo run build across all projects
pnpm lint           # eslint with zero allowed warnings
pnpm check-types    # tsc + Next.js typegen
```

## Environment configuration

`.env.example` documents every secret grouped by domain:

| Group | Highlights |
| --- | --- |
| Database | `DATABASE_URL` (Neon/Postgres) |
| Core URLs | `WEB_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ROOT_DOMAIN` |
| Auth & Social | Better Auth secrets, Google + Instagram OAuth IDs |
| Messaging | WhatsApp Cloud API tokens, QStash signing keys |
| Payments | MTN MoMo sandbox credentials, Paystack public & secret keys |
| Infra | Upstash Redis, UploadThing, Vercel tokens |
| Analytics & AI | PostHog, AI gateway, Gemini, V0 experiments |

**Never commit a populated `.env`.** Use `.env.local` overrides for machine-specific tweaks.

## Common workflows

| Task | Command |
| --- | --- |
| Format markdown + TS | `pnpm format` |
| Lint only web | `pnpm turbo run lint --filter=@shopvendly/web` |
| Watch DB package | `pnpm --filter @shopvendly/db dev` |
| Ship transactional emails | `pnpm --filter @shopvendly/transactional build` |

## Deployment notes

- **Web/Admin:** Deploy to Vercel (Node 18 runtime). Configure env groups and UploadThing/Better Auth callbacks per environment.
- **API:** Bundle with `tsup` (`pnpm --filter @shopvendly/api build`) and deploy to the preferred Node host (Vercel functions, Fly.io, etc.). Point webhooks (Instagram, WhatsApp, MTN MoMo) to the deployed API URL.
- **Database:** Managed via Neon or chosen Postgres provider. Run `pnpm --filter @shopvendly/db push` during release pipelines to apply Drizzle migrations.

## Contributing

1. Create a feature branch off `main`.
2. Keep scope small and ensure lint + type checks pass before pushing.
3. Document migrations, new env vars, and any operational changes in this README or `/docs` if added in the future.

Issues, questions, or proposals? Open a discussion or tag the relevant workspace maintainers.
