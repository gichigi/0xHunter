# 0xHunter Roadmap

// When inserting items use decimals to avoid renumbering.

## MVP Scope & Philosophy

**Core Principle:** Zero-maintenance, reliable MVP that showcases brand voice + functional NL search.

**Supported Data Sources:**
- ✅ Alchemy API (primary engine - all on-chain data)
- ✅ CoinGecko API (token metadata, logos, current prices only)
- ✅ Static config files (23 curated tokens + 22 NFT collections)
- ✅ Etherscan API (token holder queries - top holders, total supply)

**Not Supported (Post-MVP):**
- ❌ Bitquery (rate limits, breaking schemas, maintenance hell)
- ❌ Historical price charts/OHLC data
- ❌ Multi-chain support
- ❌ Arbitrary token/collection lookups (only curated list)
- ❌ Trending/discovery features
- ❌ Complex P&L accounting (rough estimates only)

**MVP Goal:** A beautifully executed demo of brand voice + functional NL search engine that "just works" with zero maintenance.

---

## Critical Issues - High Priority

### 1. Alchemy SDK Integration with Smart Fallback
**Status:** ✅ Complete  
**Impact:** SDK benefits where available, reliable fallback ensures always works

**Current State:**
- ✅ `app/api/search/route.ts` now uses SDK methods primarily:
  - `alchemy.core.getBalance()` for balance checks
  - `alchemy.core.getTransactionCount()` for tx counts
  - `alchemy.core.getTokenBalances()` for token data
  - `alchemy.core.getTokenMetadata()` for token info
  - `alchemy.nft.getNftsForOwner()` for NFT queries
- ✅ Automatic fallback to direct RPC when SDK fails in Next.js server environment
- ✅ Hybrid approach: SDK first (works for NFT calls), fallback to direct fetch for core methods that fail due to ethers.js referrer header issue

**Implementation Details:**
- SDK is tried first to leverage benefits (type safety, convenience methods)
- On "missing response" errors (Next.js/ethers.js compatibility issue), automatically falls back to direct `fetch` RPC calls
- NFT calls work via SDK (different code path)
- Core methods (balance, tx count, token balances) reliably fall back to direct RPC
- All calls succeed - hybrid ensures reliability

---

### 2. Results Page UX - Formatted Display
**Status:** ✅ Complete  
**Impact:** Professional UX, readable results, flexible content handling

**Current State:**
- ✅ Results page now displays formatted, brand-aligned UI components
- ✅ AddressAnalysisCard shows wallet info: balance (ETH + USD), transactions, status, risk
- ✅ TokenHoldingsTable displays token holdings in responsive table/mobile stack view
- ✅ TagsDisplay shows colored badges for whale/active/diversified tags
- ✅ CommentarySection handles variable-length Hunter commentary
- ✅ Raw JSON moved to collapsible accordion (hidden by default)
- ✅ Flexible ResultRenderer adapts to different intent types
- ✅ Responsive design: mobile-first, breakpoints for tablet/desktop
- ✅ Brand voice adherence: monospace for data, serif for narrative, lowercase tags

**Implementation Details:**
- Component-based architecture for maintainability
- Handles empty states gracefully ("The Hunter has nothing to report")
- Error states display in brand voice (no "Error:" prefix)
- Mobile-friendly: token table stacks on small screens
- Supports variable content lengths (short/long commentary, 0-100+ tokens)
- Color-coded risk levels and status indicators

---

### 2. Browser Alert Error Handling
**Status:** ✅ Complete  
**Impact:** Professional UX, no blocking alerts

**Current State:**
- ✅ Replaced `alert()` with inline error messages in `app/page.tsx`
- ✅ Error messages styled in brand voice (red-950/30 background, red-300 text, serif italic)
- ✅ Errors clear when user types (better UX)
- ✅ Brand voice error messages: "The Hunter cannot track this target..." / "The digital mists are too thick..."

**Implementation Details:**
- Error state managed with `useState`
- Inline error display below search bar
- Auto-clears on input change
- Maintains Hunter's dark, mysterious tone

---

### 3. Hardcoded USD Price Calculation
**Status:** ✅ Obsolete (removed USD field)  
**Impact:** N/A - `profitUsd` field removed in refactor

**Current State:**
- `profitUsd` field removed from results
- `balance` field now shows ETH only

---

### 4. Fragile Data Persistence (sessionStorage)
**Status:** ✅ Complete  
**Impact:** Results are shareable, bookmarkable, persist in URLs

**Current State:**
- ✅ Results stored in URL query params (`?q=...&data=...`)
- ✅ Results page reads from URL instead of sessionStorage
- ✅ Share/copy link button in results page header
- ✅ URLs are shareable and bookmarkable
- ✅ Results persist across tab closes (in URL)

**Implementation Details:**
- Results encoded as JSON in URL `data` param
- `useSearchParams()` wrapped in Suspense for Next.js 14
- Share button with copy-to-clipboard functionality
- Visual feedback when link copied (checkmark icon)

---

### 5. Remove Scope Abstraction - Use apiCalls Directly
**Status:** ✅ Complete  
**Impact:** More flexible, less redundant, eliminates scope/field mismatches

**Current State:**
- ✅ Removed `scope` field from `QueryPlanSchema`
- ✅ Updated AI prompt to specify exact `apiCalls` needed (not scope)
- ✅ Refactored `app/api/search/route.ts` to use `plan.apiCalls` directly
- ✅ Updated `processAddressAnalysis` to extract based on fetched data (not scope)
- ✅ Removed all scope-based conditionals throughout codebase

**Implementation Details:**
- Planner now specifies exact `apiCalls` array with method, params, and purpose
- Execution: `for (const apiCall of plan.apiCalls) { await executeApiCall(...) }`
- Extraction: `processAddressAnalysis()` checks what's in `apiResults` (not scope)
- Returns: Only fields that were actually fetched and extracted
- More flexible: AI can request exactly what it needs (e.g., "balance + NFTs but no tokens")
- Less error-prone: No scope/field mismatches

---

## Medium Priority Issues

### 6. Duplicate/Unused Code
**Status:** ✅ Complete  
**Impact:** Code consolidated, no duplication, cleaner architecture

**Current State:**
- ✅ `lib/ai-agent.ts` updated with complete `QueryPlanSchema` and `createQueryPlan` function
- ✅ `app/api/search/route.ts` now imports and uses `createQueryPlan` from `@/lib/ai-agent`
- ✅ Removed duplicate `QueryPlanSchema` and `planQuery` function from route.ts
- ✅ Single source of truth for AI agent logic

**Implementation Details:**
- Consolidated `QueryPlanSchema` with `scope` field and updated intent enum in `lib/ai-agent.ts`
- Moved complete `createQueryPlan` function with AI prompt and fallback logic to `lib/ai-agent.ts`
- Updated `app/api/search/route.ts` to import `createQueryPlan` instead of defining locally
- Removed ~140 lines of duplicate code from route.ts

---

### 7. No Input Validation
**Status:** ✅ Complete  
**Impact:** Invalid queries blocked before API calls, better error messages, resource savings

**Current State:**
- ✅ Created `utils/validation.ts` with `validateQuery` function using `@ethersproject/address`
- ✅ Client-side validation in `app/page.tsx` before API call
- ✅ Server-side validation in `app/api/search/route.ts` as safety net
- ✅ Brand voice error messages for all validation failures

**Implementation Details:**
- Validation checks query length (3-500 characters)
- Validates Ethereum addresses only if detected in query (supports queries without addresses)
- Uses `isAddress()` from `@ethersproject/address` for checksum validation
- Client-side validation prevents unnecessary API calls
- Server-side validation provides safety net for direct API access
- All error messages use brand voice: "The Hunter needs more to track...", "The path is too long...", etc.

---

### 8. Limited Token Support
**Status:** ✅ Complete  
**Impact:** Now supports 23 popular tokens with automatic symbol resolution

**Current State:**
- ✅ Static config with 23 popular tokens in `config/tokens.json`
- ✅ Token resolver with fallback chain: static config → in-memory cache → CoinGecko API
- ✅ NFT resolver for 22 popular collections in `config/nft-collections.json`
- ✅ All addresses verified with Alchemy API

**Implementation Details:**
- ✅ Created `utils/token-resolver.ts` with `resolveTokenSymbol()` function
- ✅ Fallback chain: static config (fast) → in-memory cache (24h TTL) → CoinGecko API
- ✅ Created `utils/nft-resolver.ts` for collection name → address resolution
- ✅ Integrated into `lib/ai-agent.ts` for automatic token/NFT extraction
- ✅ Verification script (`scripts/verify-addresses.ts`) validates all addresses
- ✅ Fixed script (`scripts/fix-addresses.ts`) finds correct addresses via CoinGecko + Alchemy

**Supported Tokens (23):**
USDC, USDT, DAI, WBTC, WETH, UNI, LINK, AAVE, MKR, CRV, SNX, COMP, YFI, SUSHI, 1INCH, PEPE, SHIB, MATIC, LDO, ARB, ENS, GRT, APE

**Supported NFT Collections (22):**
BAYC, MAYC, Pudgy Penguins, Azuki, Milady, CryptoPunks, DeGods, Moonbirds, Doodles, CloneX, Checks, Mfers, Cool Cats, World of Women, Meebits, VeeFriends, Art Blocks, Autoglyphs, Loot, Nouns, Goblintown, Pudgy Rodents

---

### 8.5. Improve Brand Voice/Prompt
**Status:** Not Started  
**Impact:** AI responses sometimes include emojis or don't match brand voice guidelines

**Current State:**
- AI responses occasionally include emojis (e.g., 🖤) which violates brand voice
- Brand voice guidelines in `BRAND_VOICE.md` specify no emojis in UI
- Prompt in `lib/ai-agent.ts` may need strengthening to enforce brand voice rules

**Action Items:**
- Review and strengthen AI prompt to explicitly forbid emojis
- Add examples of correct vs incorrect responses to prompt
- Test with various queries to ensure brand voice consistency
- Ensure responses match "mysterious, understated, no fluff" tone

---

### 9. No Rate Limiting
**Status:** Not Started  
**Impact:** Could hit API limits, abuse potential

**Current State:**
- No rate limiting on `/api/search` endpoint
- No request throttling

**Action Items:**
- Implement rate limiting (per IP/user)
- Add request throttling middleware
- Return 429 errors with retry-after headers

---

## Low Priority - Nice to Have

### 9. Missing Loading States Between Pages
**Status:** Not Started  
**Impact:** User sees blank page during redirect

**Current State:**
- Full page redirect with `window.location.href`
- No loading indicator during transition

**Action Items:**
- Use Next.js router for client-side navigation
- Show loading spinner during page transition
- Progressive loading of results

---

### 10. Sequential Token Metadata Fetching
**Status:** Partially Optimized  
**Impact:** Performance, slower results

**Current State:**
- Already uses `Promise.all` but could batch better
- Fetches metadata for top 10 tokens individually

**Action Items:**
- Batch token metadata requests if Alchemy supports it
- Cache token metadata locally
- Limit metadata fetching to visible tokens only

---

### 11. Time‑Scoped Transfer Analytics (address in/out by time)
**Status:** Not Started  
**Impact:** Enables “when did this wallet send/receive X?” queries and time-window summaries

**Current State:**
- Using `core.getAssetTransfers` in places, but no generalized, paginated, time-scoped analytics helper

**Action Items:**
- Build a reusable transfer fetcher with pagination (`pageKey`), category filters (external, internal, erc20, erc721, erc1155), and block/time window
- Normalize results to a common Transfer model { ts, block, hash, from, to, assetType, contract, tokenId?, symbol?, amount }
- Add caching with short TTL (1–5 minutes) and hard caps per scope (pages/time range)

**Recommended Suppliers:**
- Primary: Alchemy SDK (`core.getAssetTransfers` with `withMetadata`, `fromBlock`, `toBlock`, `maxCount`, `pageKey`)

---

### 12. NFT Ownership Analytics (top holders for a contract)
**Status:** Not Started  
**Impact:** Enables “which address holds the most of X NFT collection?”

**Current State:**
- No contract-wide ownership aggregation

**Action Items:**
- Use `nft.getOwnersForContract` (optionally with token balances) and aggregate per owner; handle pagination
- For very large collections, add fallback to a fast index provider; cap pages per scope
- Return top N owners with counts and optional percentages

**Recommended Suppliers:**
- Primary: Alchemy SDK (`nft.getOwnersForContract`, `nft.getOwnersForNft`)
- Fallback for large collections: Reservoir API (owners endpoints)

---

### 13. Trade PnL / “Most Profitable Trade” (tokens & NFTs)
**Status:** Not Started  
**Impact:** High-value analytics (profitability, best trade) across tokens/NFTs

**Current State:**
- No price-at-timestamp plumbing or sales indexing; no swap detection

**Action Items:**
- Tokens: detect swaps via DEX event logs (`core.getLogs` + ABI decode) or inferred transfer bundles; compute proceeds/Cost using prices at block timestamp; start with FIFO; pick max PnL
- NFTs: ingest sales (price, marketplace) + acquisition transfers; subtract fees; pick max PnL
- Add price adapter: get ETH/token price at timestamp; cache results

**Recommended Suppliers:**
- Token prices (current): CoinGecko (free, good coverage)
- NFT sales/owners: Alchemy SDK only (no external dependencies for MVP)
- Core chain data: Alchemy SDK (logs, receipts, transfers)
- **Note:** Historical price precision requires external APIs - defer to Post-MVP

---

### 14. Orchestration & Streaming (planner/executor)
**Status:** Not Started  
**Impact:** Reliable multi-step queries with pagination and partial results

**Current State:**
- Single-step execution; no streamed partials for deep queries

**Action Items:**
- Strengthen planner: multi-step plan with stop conditions, page caps, and scope (minimal/standard/full/deep)
- Executor: standardized pagination loop with backoff; streaming partial responses to UI
- Add per-query cache keys; short TTL; fallbacks on rate limits

**Recommended Suppliers:**
- Alchemy SDK for core data; CoinGecko for token prices
- Internal streaming via Next.js route handlers; optional queue later if needed
- **Note:** Defer to Post-MVP - adds complexity without MVP value

---

## Implementation Priority

### MVP Phase (Current Focus)

**Core Features:**
1. ✅ Results page UX formatting
2. ✅ Error handling improvements
3. ✅ Input validation
4. ✅ Code cleanup (remove duplicates)
5. ✅ Remove scope abstraction - use apiCalls directly (5)
6. ✅ Static token/NFT config (23 tokens + 22 NFT collections)
7. ✅ CoinGecko integration (token metadata, logos, current prices)
8. Caching layer (24-48h for Alchemy, indefinite for CoinGecko metadata)
9. Homepage query examples (5-10 clickable examples)
10. ✅ Token support expansion with static config (8)

**Supported Query Types (15-20):**
- Wallet: "What does 0x... hold?", "Compare wallets", "NFTs owned by 0x..."
- Token: "Top 10 USDC holders", "Price of UNI" (curated list only)
- NFT: "Top Azuki holders", "Does 0x... own Pudgy Penguins?" (curated list only)
- Transfer: "Did 0x... send ETH to 0x...?", "Largest transfer from 0x..."

### Post-MVP (If Demand Exists)

**Deferred Features:**
- Time-scoped transfer analytics (11) - Complex pagination, defer
- Full Trade PnL (13) - Use simple estimates only for MVP
- Orchestration & streaming (14) - Overengineering for MVP
- Rate limiting - Add if needed
- NFT ownership analytics (12) - Keep if Alchemy-only, no external deps

**Not Planned:**
- Bitquery integration (removed - maintenance burden)
- Historical price charts
- Multi-chain support
- Arbitrary token/collection lookups

