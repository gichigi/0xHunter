# AGENTS.md

## Cursor Cloud specific instructions

Single Next.js 14 app (no monorepo). All commands run from the workspace root.

### Services

| Service | Command | Notes |
|---|---|---|
| Dev server | `pnpm dev` | Runs on port 3000 |

### Key commands

- See `package.json` scripts for lint/build/dev/start
- Lint: `pnpm lint` (requires `.eslintrc.json` with `next/core-web-vitals`)
- Build: `pnpm build`
- Dev: `pnpm dev`

### Environment variables

- Copy `.env.example` to `.env.local` and fill in API keys
- Required: `OPENAI_API_KEY`, `ALCHEMY_API_KEY`
- Optional: `COINGECKO_API_KEY`
- Without valid API keys the search API will return fallback/empty results but the UI still loads

### Known issues

- **Vercel file tracing**: `next.config.mjs` had `node_modules/**/*` in `outputFileTracingExcludes` which breaks API routes on Vercel (serverless functions can't find dependencies). The fix removes that exclusion; `.npmrc` with `node-linker=hoisted` prevents the pnpm-symlink-caused micromatch stack overflow during tracing.
- **ESLint config**: The repo ships without `.eslintrc.json`. Running `pnpm lint` for the first time prompts interactively. Create `.eslintrc.json` with `{"extends": "next/core-web-vitals"}` before running lint.
- **3 pre-existing lint errors**: Unescaped `'` in `opengraph-image.tsx`, `results/page.tsx`, and `commentary-section.tsx` (react/no-unescaped-entities).

### Deployment

- Prod is on Vercel at `https://0x-hunter.vercel.app`
- Deploys from `main` branch
- Vercel deployments were failing instantly as of Feb 2026 - likely an account-level issue (check Vercel dashboard)
