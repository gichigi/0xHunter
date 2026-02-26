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

- **Vercel file tracing**: Next.js 14.0.0 had a micromatch stack overflow bug during build trace collection with pnpm's `.pnpm` store structure. Fixed by upgrading to Next.js 14.2.35. Do NOT add `node_modules/**/*` to `outputFileTracingExcludes` - it breaks API routes on Vercel.
- **3 pre-existing lint errors**: Unescaped `'` in `opengraph-image.tsx`, `results/page.tsx`, and `commentary-section.tsx` (react/no-unescaped-entities).

### Deployment

- Prod is on Vercel at `https://0x-hunter.vercel.app`
- Deploys from `main` branch
