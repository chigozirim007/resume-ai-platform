# TailorFolio

An AI-powered SaaS tool that tailors resumes, scores job matches, and generates cover letters for job seekers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/resume-ai run dev` — run the frontend (port 18731)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui, Wouter routing
- API: Express 5 + cookie-parser + openid-client
- DB: PostgreSQL + Drizzle ORM (tables: users, resumes, analyses, sessions)
- Auth: Replit OIDC via `openid-client`; sessions stored in `sessionsTable`
- AI: OpenAI via Replit AI Integrations (gpt-5.1)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — DB tables: users (varchar id), resumes, analyses, auth (sessions)
- `lib/replit-auth-web/src/use-auth.ts` — `useAuth()` hook for frontend
- `artifacts/api-server/src/lib/auth.ts` — OIDC config, session CRUD
- `artifacts/api-server/src/middlewares/authMiddleware.ts` — session → `req.user`
- `artifacts/api-server/src/routes/auth.ts` — `/login`, `/callback`, `/logout`, `/auth/user`
- `artifacts/api-server/src/routes/` — Express route handlers (all use `req.user.id`)
- `artifacts/api-server/src/lib/ai.ts` — OpenAI resume analysis service
- `artifacts/resume-ai/src/pages/` — Landing, Dashboard, Resumes, Analyze, AnalysisDetail, History
- `artifacts/resume-ai/src/App.tsx` — `AuthGate` component wraps all protected routes
- `artifacts/resume-ai/src/index.css` — Theme (dark navy + green accent)

## Architecture decisions

- Replit OIDC auth: user ID is a string (UUID from Replit), stored in `users.id varchar`
- Sessions stored in PostgreSQL `sessionsTable` (not in-memory); TTL = 7 days
- `authMiddleware` runs on every request; sets `req.user` from session; token refresh on expiry
- All protected routes call `req.isAuthenticated()` — return 401 if not authenticated
- No `userId` in request bodies/params; server reads it from `req.user.id`
- Keywords stored as JSON strings in DB (PostgreSQL), parsed on read
- Free plan capped at 3 analyses (checked server-side, 403 triggers upgrade modal)
- Orval zod config uses `mode: "single"` with workspace pointing at `src/generated/` to avoid index conflict
- API contract uses `/api` base; proxy routes `/api` to the API server and `/` to the frontend

## Product

- Landing page with hero, stats, features, testimonials, CTA
- Auth gate on all app routes — unauthenticated users redirected to Replit login
- Dashboard with live stats (analyses run, avg match score, saved resumes, plan) + free usage bar
- Sidebar shows real user name + avatar from Replit profile; logout button
- Resume library: create, edit, delete, tag by role type, load into analysis form
- Analyze page: paste job description + resume → 15-30s AI analysis; pre-fills from re-analyze URL params; upgrade modal on 403
- Analysis detail: match score ring, matched/missing keyword chips, tailored resume + cover letter (copy + download .txt), line-level diff view (original vs tailored), re-analyze button
- History page: full analysis list with search by title/company, filter by match score (strong/moderate/weak), per-row delete

## User preferences

_Populate as you build_

## Gotchas

- After spec changes: run `pnpm --filter @workspace/api-spec run codegen` before building
- Orval config sets workspace to `src/generated/` not `src/` to avoid regenerating index.ts
- `lib/api-zod/src/index.ts` should only export from `./generated/api/api`
- Always use `req.log` inside route handlers; never `console.log`
- `lib/replit-auth-web` needs `composite: true` in tsconfig and `vite` as devDep for `import.meta.env`
- DB push may prompt about column renames on schema changes — drop and recreate tables in dev to avoid

## Pointers

- See `.local/skills/replit-auth` for auth implementation details
- See `.local/skills/pnpm-workspace` for workspace structure
- See `.local/skills/ai-integrations-openai` for OpenAI integration details
