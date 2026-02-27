# Implementation Plan - Project Initialization

## Goal Description
Initialize the University Business Matching Platform using Next.js 14+ (App Router). The goal is to set up a robust foundation with Supabase as the unified backend (Auth, Database, Realtime, Storage) to streamline development for the MVP.

## User Review Required
> [!IMPORTANT]
> **Tech Stack Consolidation**: I am proposing **Supabase Auth** instead of Clerk/NextAuth.js.
> **Reason**: You selected Supabase for Database, Realtime, and Vector DB. Using Supabase for Authentication as well significantly reduces architectural complexity (unified RLS policies, single SDK, automatic user syncing) and speeds up the MVP Phase 1 & 2 delivery.

> [!NOTE]
> **CSS Strategy**: Will use **Vanilla CSS** (CSS Modules) as per system guidelines for maximum control, avoiding TailwindCSS users explicitly requested otherwise.

## Proposed Changes

### Project Structure
#### [NEW] `uni-match/`
- Initialize Next.js project with TypeScript and ESLint.
- Configure `jsconfig.json` / `tsconfig.json` for path aliases (`@/*`).

### Dependencies
- `supabase-js` & `@supabase/ssr` for backend interaction.
- `lucide-react` for icons (standard, lightweight).
- `zod` for validation.

### Core Components
#### [NEW] `lib/supabase/`
- `server.ts`: Server-side Supabase client.
- `client.ts`: Client-side Supabase client.

#### [NEW] `app/globals.css`
- strict reset and tokens (colors, typography) defined in CSS variables.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify type safety and build success.
- Run `npm run lint`.

### Manual Verification
- Start dev server `npm run dev`.
- Verify landing page loads without errors.
