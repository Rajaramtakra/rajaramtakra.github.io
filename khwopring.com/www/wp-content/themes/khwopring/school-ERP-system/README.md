# School ERP & Management System

A modular, multi-role School ERP. This repository currently implements **Phase 1**
of a phased build (see `docs/ROADMAP.md`): the full data model for every planned
module, plus a fully working vertical slice — Auth/RBAC, Academic Setup, Admissions
(Draft → Enrolled workflow), and Student Management.

## Tech stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + ShadCN-style UI components + Zustand + React Hook Form + Zod + Recharts
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT access tokens (15m) + rotating httpOnly-cookie refresh tokens (7d), Argon2 password hashing
- **Validation**: Zod schemas shared between frontend and backend (`packages/shared`)

## Repository structure

```
apps/api      Express + TypeScript backend (see src/modules/<domain>)
apps/web      React + TypeScript frontend (see src/modules/<domain>)
packages/shared  Zod schemas, enums, RBAC permission matrix, shared TS types
docker-compose.yml   Postgres + Adminer for local development
```

## Prerequisites

- Node.js 20+ and npm
- Docker Desktop (recommended) **or** a local/managed PostgreSQL instance

> **Verified live end-to-end.** This sandbox has no Docker and no system Postgres
> install, so a real (non-Docker) Postgres 18 instance was spun up via the
> `embedded-postgres` npm package (see `tools/devdb/`) purely to prove everything
> actually works: migrations applied cleanly, seeding succeeded, the API and
> frontend both ran, and a headless-browser session logged in and drove a full
> Admission Draft → Submitted → Review → Approved → Enrolled flow, landing on a
> real generated student record (`GWIS-2026-00001`) with its guardian correctly
> linked. The integration test suite also passed against this same database.
> `tools/devdb/` is a throwaway verification aid, not part of the app — for your
> own machine, use Docker Compose below (or the same no-Docker trick if you'd
> rather not install Docker: `cd tools/devdb && npm install && node start.js`,
> then point `DATABASE_URL` in `apps/api/.env` at
> `postgresql://erp_user:erp_password@localhost:5432/school_erp?schema=public`).

## Setup

```bash
# 1. Install dependencies (from repo root)
npm install

# 2. Configure environment
cp .env.example apps/api/.env
# adjust apps/api/.env if you're not using the bundled docker-compose Postgres

# 3. Start Postgres (+ Adminer at http://localhost:8080)
docker compose up -d

# 4. Generate the Prisma client, run migrations, seed data
npm run db:generate --workspace=apps/api
npm run db:migrate --workspace=apps/api
npm run db:seed --workspace=apps/api

# 5. Run the API (http://localhost:4000, docs at /api/docs)
npm run dev:api

# 6. In a second terminal, run the frontend (http://localhost:5173)
npm run dev:web
```

Default seeded login (from `.env.example` / `apps/api/prisma/seed.ts`):

```
email:    admin@greenwood.edu
password: Admin@12345
```

## Verifying it works

1. `npm run db:migrate --workspace=apps/api` — creates every table for every
   module (the full `schema.prisma`, all ~20 domains). If this errors, `DATABASE_URL`
   isn't reachable — check `docker compose ps`.
2. `npm run db:seed --workspace=apps/api` — should print the seeded school, admin
   login, and finish without error.
3. `curl http://localhost:4000/health` → `{"status":"ok",...}`.
4. Open `http://localhost:4000/api/docs` — Swagger UI listing all Phase 1 endpoints.
5. Open `http://localhost:5173`, log in with the seeded admin account, and:
   - See the dashboard render real counts (0s initially — that's correct, nothing
     is seeded beyond roles/school/academic structure; no fabricated numbers).
   - Go to **Academic Setup**, confirm the seeded sessions/classes/sections exist.
   - Go to **Admissions → New application**, create a draft, then walk it through
     Submit → Review → Approve → Enroll — this creates a real `Student` row with
     a generated registration number.
   - Go to **Students**, open the new student, try Suspend / Reinstate / Transfer
     Certificate / Alumni conversion.
6. `npm test --workspace=apps/api` — runs 17 unit tests (RBAC matrix integrity,
   pagination helpers, admission state-machine transitions) against a mocked
   Prisma client; these pass without a database.
7. To run the integration test (real DB, drives login → full admission workflow
   through actual HTTP + Prisma):
   ```bash
   RUN_INTEGRATION=1 npm test --workspace=apps/api
   ```

## RBAC

11 roles are seeded (Super Admin, School Admin, Principal, Accountant, Teacher,
Student, Parent, Receptionist, Librarian, Transport Manager, HR Manager). The full
permission matrix — every `resource:action` grant per role — lives in
[`packages/shared/src/permissions.ts`](packages/shared/src/permissions.ts) and is
applied to both API route guards (`requirePermission`) and frontend UI gating
(`<Can>` / `RequirePermission`) from the same source of truth.

## What's implemented vs. planned

**Implemented (Phase 1):** full data model for every module; Auth (JWT + refresh
rotation + RBAC); Academic Setup (sessions/classes/sections/subjects/subject
assignment); Admissions (Draft→Submitted→Review→Approved/Rejected→Enrolled,
document upload, registration-number generation); Student Management (profile,
guardians, emergency contacts, search, promotion, suspension/reinstatement,
transfer certificate, alumni conversion); role-aware dashboards backed by real
queries; audit logging; pagination; soft deletes; API docs.

**Planned next (see `docs/ROADMAP.md` for the full phase breakdown):** Timetable,
Attendance, Teacher/Parent portals (Phase 2); Fees, full Accounting, Payroll,
PDF billing/certificates (Phase 3); Exams & cross-module Reporting (Phase 4);
HR/Recruitment, Library, Transport, Inventory, Communication, Settings (Phase 5).
Widgets for these modules are intentionally absent from the dashboard rather than
showing placeholder numbers, since no module producing that data exists yet.

## Known gaps to be aware of

- Student profile editing has a working API (`PATCH /students/:id`) but no
  dedicated edit form in the UI yet (view-only in Phase 1).
- `npm audit` reports 5 advisories (3 moderate, 1 high, 1 critical), all in the
  `vite`/`vitest` dev-tooling dependency chain (dev server path-traversal / NTLM
  hash disclosure issues) — none are in code that ships in the production build.
  They only matter if you expose `npm run dev:web` or `vitest --ui` on an
  untrusted network. Run `npm audit` yourself and upgrade vite/vitest to a
  patched major version before doing that.
