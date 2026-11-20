# Repository Guidelines

## Project Structure & Module Organization
FoodBridge uses Next.js 16, React 19, strict TypeScript, and Tailwind CSS v4.
- `src/app/(site)/`: public pages; `src/app/(app)/`: donor, NGO, volunteer, and admin portals.
- `src/app/actions/` and `src/app/api/`: Server Actions and route handlers.
- `src/lib/<domain>/`: business logic; `src/components/`: shared UI and portal components.
- `src/db/`: Drizzle schema, database initialization, and seeds.
- `public/`: static assets; `scripts/`: translation checks; `integrations/n8n/`: chat workflow templates.
- `food-bridge/`: reference design prototype, excluded from the main TypeScript project.

## Build, Test, and Development Commands
Run commands from the repository root with Node.js 20+:
- `npm ci`: install locked dependencies.
- `npm run dev`: start development at `http://localhost:3000`.
- `npm run build`: create the production build and check types.
- `npm start`: serve the production build.
- `npm run lint`: run ESLint; `npx eslint src` limits checks to application source.
- `npx tsc --noEmit`: check TypeScript without emitting files.
- `npm run i18n:check`: report missing Bangla translations.
- `npm run i18n:test`: run translator smoke checks.

## Coding Style & Naming Conventions
Follow existing two-space indentation, double quotes, and semicolons. Use PascalCase for components, camelCase for functions, and kebab-case filenames such as `donation-edit-form.tsx`. Prefer `@/` imports for `src/`. ESLint uses Next.js Core Web Vitals and TypeScript rules; no Prettier configuration is present.

Reuse `src/components/ui/` and tokens in `src/app/globals.css`. Add Bangla dictionary entries under `src/lib/bn/` when changing translated text; public landing copy lives in `src/components/home/copy.ts`.

## Testing Guidelines
There is no general test runner or coverage threshold. Existing checks use `scripts/i18n-smoke.ts`; follow `scripts/<feature>-smoke.ts` for similar checks. Validate code changes with type checking, source linting, and a production build. Exercise affected role workflows in a browser, including English/Bangla and mobile layouts.

## Commit & Pull Request Guidelines
Recent commits use descriptive imperative subjects, such as “Schedule daily housekeeping cron on Vercel”. Follow that style. PRs should describe behavior changes, link relevant issues, record validation, and include screenshots for UI changes. Call out configuration or schema changes.

## Architecture & Configuration
Keep actions thin: authenticate, validate, call services, then revalidate. Route donation status changes through `transitionDonation()` or `transitionInTx()`. Consult `CLAUDE.md` for detailed invariants.

Copy `.env.example` to `.env.local`; set `SESSION_SECRET` to 32+ random characters. Never commit secrets. Local PGlite allows one process per database folder; use a separate `DATABASE_DIR` for additional servers.
