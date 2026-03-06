# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OwlRoles Hub is a job portal/recruitment platform built with Next.js (App Router) + React 18 + TypeScript. It connects candidates, recruiters, and admins. Backend is Supabase (auth, database, edge functions). Frontend deploys as a static export to Cloudflare Pages.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build` (static export to `out/`)
- **Lint:** `npm run lint`
- **Tests:** `npm run test` (single run) or `npm run test:watch` (watch mode)
- **Single test:** `npx vitest run src/path/to/file.test.ts`
- **Deploy CF worker:** `cd cloudflare-worker && npx wrangler deploy`

## Architecture

### Frontend (src/)
- **Next.js App Router** with static export (`output: "export"` in `next.config.ts`)
- **Routing:** `src/app/` contains route pages that wrap view components from `src/views/`
- **UI layer:** shadcn/ui components (in `src/components/ui/`) with Tailwind CSS and CSS variables for theming
- **State:** React Query (`@tanstack/react-query`) for server state, React Context for auth and theme
- **Providers:** Wrapped in `src/app/providers.tsx` (QueryClient, Theme, Auth, Tooltip, Toasters)
- **Path alias:** `@` maps to `src/` (configured in tsconfig)
- All pages are client-side rendered (`"use client"`) since the app is a static export

### Key Directories
- `src/app/` — Next.js App Router pages (thin wrappers importing from `src/views/`)
- `src/views/` — Page-level view components (Index, Auth, CandidateDashboard, RecruiterDashboard, AdminDashboard, PostJob, etc.)
- `src/components/` — Feature components (top-level) plus organized subdirectories: `admin/`, `events/`, `profile/`, `recruiter/`, `resume-review/`, `ui/`
- `src/contexts/` — AuthContext (Supabase auth with `useAuth` hook) and ThemeContext
- `src/hooks/` — Custom hooks (useEvents, useJobsWithRecruiters, useRecruiterDashboard, useAdminStats)
- `src/integrations/supabase/` — Supabase client and auto-generated types. Import as `import { supabase } from "@/integrations/supabase/client"`
- `src/types/` — Shared TypeScript types (events, recruiter, speech-recognition)
- `src/lib/` — Utilities (profileUtils, validations, shadcn `cn()` helper)

### Backend (supabase/)
- **Edge Functions** in `supabase/functions/` — each has its own directory with `index.ts`: suggest-salary, match-jobs, parse-resume, fetch-scopus, fetch-orcid, send-recruiter-message, send-status-notification, recruiter-chat, track-email-event, admin-mass-upload, admin-delete-user
- All edge functions have `verify_jwt = false` in `supabase/config.toml`
- Supabase functions directory is excluded from tsconfig (Deno runtime, not Node)

### Cloudflare Worker (cloudflare-worker/)
- Reverse proxy for Supabase to bypass regional domain blocking
- Routes all Supabase requests through a Cloudflare Worker URL with CORS handling

### Auth Flow
- Three user roles: candidate, recruiter, admin
- Protected routes use `ProtectedRoute` component wrapping auth-required pages
- Admin panel at `/adpanel` (hidden, not linked from navigation)
- Auth state managed via Supabase `onAuthStateChange` listener in AuthContext

### Deployment
- **Cloudflare Pages:** Auto-deploys on push to main via `.github/workflows/cf.yaml` (deploys `out/` directory)
- **GitHub Pages:** Manual deploy via `.github/workflows/deploy.yaml` (workflow_dispatch)

## Environment Variables

Prefix with `NEXT_PUBLIC_` for client-side access (stored in `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/publishable key

## Conventions

- Navigation uses `useRouter` from `next/navigation` (`.push()`, `.replace()`) and `<Link href="...">` from `next/link`
- `useSearchParams()` from `next/navigation` is read-only; use `router.push()` with query strings to update URL params
- shadcn/ui components are added via `npx shadcn-ui@latest add <component>` (style: default, base color: slate, CSS variables enabled)
- Test files go in `src/` with `.test.ts` or `.spec.ts` extensions; test setup in `src/test/setup.ts`; uses jsdom environment via vitest
- Static images go in `public/` and are referenced as absolute paths (e.g., `/logo-light.png`)
