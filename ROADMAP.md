# 0xHunter Roadmap

// When inserting items use decimals to avoid renumbering.

## V1 Scope & Philosophy

**Core Principle:** Limited scope, reliable v1 that showcases brand voice + functional NL search for the 3 most common query types.

**Supported Data Sources:**
- ✅ Alchemy API (primary engine - all on-chain data)
- ✅ CoinGecko API (token metadata, logos, current prices only)
- ✅ Static config files (23 curated tokens + 22 NFT collections)

**V1 Query Types (3 only):**
1. **Address Analysis** (single address)
   - "What does 0x... hold?"
   - "Balance of 0x..."
   - "Analyze 0x..."
   - Returns: ETH balance, transaction count, token holdings, NFTs

2. **Token Price** (curated tokens only)
   - "Price of UNI"
   - "What's PEPE worth?"
   - Returns: Current USD price from CoinGecko

3. **NFT Ownership** (single address + curated collections only)
   - "Does 0x... own BAYC?"
   - "NFTs owned by 0x..."
   - Returns: NFT count, collection breakdown
   - **V1 Limitation:** Only 22 curated NFT collections supported (no dynamic lookup)

**Not in V1 (Deferred):**
- ❌ Multi-address comparisons
- ❌ Transfer history queries
- ❌ Token holder queries ("top holders")
- ❌ NFT holder queries ("cryptopunks holders")
- ❌ Complex analytics (P&L, patterns, relationships)
- ❌ Etherscan API (not needed for v1)
- ❌ Historical price charts/OHLC data
- ❌ Multi-chain support
- ❌ Dynamic NFT collection lookup (only 22 curated collections in v1)
- ❌ Arbitrary token/collection lookups (tokens work via CoinGecko, NFTs are curated only)

**V1 Goal:** A beautifully executed demo of brand voice + functional NL search for 3 core query types that "just works" with zero maintenance.

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
- Handles empty states gracefully ("0xHunter has nothing to report")
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
- ✅ Brand voice error messages: "0xHunter cannot track this target..." / "The digital mists are too thick..."

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
- All error messages use brand voice: "0xHunter needs more to track...", "The path is too long...", etc.

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
**Status:** ✅ Complete  
**Impact:** AI responses now follow brand voice guidelines consistently

**Current State:**
- ✅ `BRAND_VOICE.md` file is read and included in response generation prompt
- ✅ Brand voice guidelines dynamically loaded from file (not hardcoded)
- ✅ Response prompt simplified and focused on brand voice principles
- ✅ Planning prompt simplified to remove redundant instructions

**Implementation Details:**
- `app/api/search/route.ts` reads `BRAND_VOICE.md` from filesystem and includes in prompt
- Full brand voice guidelines passed to AI model for every response
- Simplified prompts remove redundancy while maintaining brand voice enforcement

---

### 9. No Rate Limiting
**Status:** Deferred to Post-V1  
**Impact:** Could hit API limits, abuse potential

**Current State:**
- No rate limiting on `/api/search` endpoint
- No request throttling

**Action Items (Post-V1):**
- Implement rate limiting (per IP/user)
- Add request throttling middleware
- Return 429 errors with retry-after headers

---

## Low Priority - Nice to Have

### 9. Missing Loading States Between Pages
**Status:** Deferred to Post-V1  
**Impact:** User sees blank page during redirect

**Current State:**
- Full page redirect with `window.location.href`
- No loading indicator during transition

**Action Items (Post-V1):**
- Use Next.js router for client-side navigation
- Show loading spinner during page transition
- Progressive loading of results

---

### 10. Sequential Token Metadata Fetching
**Status:** Deferred to Post-V1  
**Impact:** Performance, slower results

**Current State:**
- Already uses `Promise.all` but could batch better
- Fetches metadata for top 10 tokens individually

**Action Items (Post-V1):**
- Batch token metadata requests if Alchemy supports it
- Cache token metadata locally
- Limit metadata fetching to visible tokens only

---

### 11. Time‑Scoped Transfer Analytics (address in/out by time)
**Status:** Deferred to Post-V1  
**Impact:** Enables "when did this wallet send/receive X?" queries and time-window summaries

**Current State:**
- V1 does not support transfer history queries
- Using `core.getAssetTransfers` in places, but no generalized, paginated, time-scoped analytics helper

**Action Items (Post-V1):**
- Build a reusable transfer fetcher with pagination (`pageKey`), category filters (external, internal, erc20, erc721, erc1155), and block/time window
- Normalize results to a common Transfer model { ts, block, hash, from, to, assetType, contract, tokenId?, symbol?, amount }
- Add caching with short TTL (1–5 minutes) and hard caps per scope (pages/time range)

**Recommended Suppliers:**
- Primary: Alchemy SDK (`core.getAssetTransfers` with `withMetadata`, `fromBlock`, `toBlock`, `maxCount`, `pageKey`)

---

### 12. NFT Ownership Analytics (top holders for a contract)
**Status:** Deferred to Post-V1  
**Impact:** Enables "which address holds the most of X NFT collection?"

**Current State:**
- No contract-wide ownership aggregation
- V1 only supports: "Does address X own NFT collection Y?" (single address queries)

**Action Items (Post-V1):**
- Use `nft.getOwnersForContract` (optionally with token balances) and aggregate per owner; handle pagination
- For very large collections, add fallback to a fast index provider; cap pages per scope
- Return top N owners with counts and optional percentages

**Recommended Suppliers:**
- Primary: Alchemy SDK (`nft.getOwnersForContract`, `nft.getOwnersForNft`)
- Fallback for large collections: Reservoir API (owners endpoints)

---

### 12.5. Dynamic NFT Collection Resolution (OpenSea/Reservoir fallback)
**Status:** Deferred to Post-V1  
**Impact:** Enables queries for any NFT collection, not just curated 22

**Current State:**
- V1: NFT resolution uses static config only (22 curated collections)
- Tokens have fallback chain (static → cache → CoinGecko), NFTs don't
- Users can only query collections in static config

**Action Items (Post-V1):**
- Add fallback chain to `resolveNFTCollection()`: static config → in-memory cache → OpenSea/Reservoir API
- Implement OpenSea API search endpoint for collection name → address lookup
- Or use Reservoir API (has collection search endpoints)
- Add in-memory cache with 24h TTL (same pattern as token resolver)
- Make `resolveNFTCollection()` async to support API calls
- Update `lib/ai-agent.ts` to handle async NFT resolution (parallel resolution like tokens)

**Recommended Suppliers:**
- Primary: OpenSea API (collection search endpoint)
- Alternative: Reservoir API (collection search endpoints)
- Cache: In-memory cache (24h TTL, same as token resolver)

**Implementation Pattern:**
- Mirror `utils/token-resolver.ts` pattern
- Fallback chain: static config (fast) → cache (24h) → OpenSea API (external lookup)
- Cache results for future queries

---

### 13. Trade PnL / "Most Profitable Trade" (tokens & NFTs)
**Status:** Deferred to Post-V1  
**Impact:** High-value analytics (profitability, best trade) across tokens/NFTs

**Current State:**
- V1 does not support P&L or profitability queries
- No price-at-timestamp plumbing or sales indexing; no swap detection

**Action Items (Post-V1):**
- Tokens: detect swaps via DEX event logs (`core.getLogs` + ABI decode) or inferred transfer bundles; compute proceeds/Cost using prices at block timestamp; start with FIFO; pick max PnL
- NFTs: ingest sales (price, marketplace) + acquisition transfers; subtract fees; pick max PnL
- Add price adapter: get ETH/token price at timestamp; cache results

**Recommended Suppliers:**
- Token prices (current): CoinGecko (free, good coverage)
- NFT sales/owners: Alchemy SDK only (no external dependencies)
- Core chain data: Alchemy SDK (logs, receipts, transfers)
- **Note:** Historical price precision requires external APIs - defer to Post-V1

---

### 14. Orchestration & Streaming (planner/executor)
**Status:** Deferred to Post-V1  
**Impact:** Reliable multi-step queries with pagination and partial results

**Current State:**
- V1 uses simple single-step execution
- No streamed partials for deep queries (not needed for v1 scope)

**Action Items (Post-V1):**
- Strengthen planner: multi-step plan with stop conditions, page caps, and scope (minimal/standard/full/deep)
- Executor: standardized pagination loop with backoff; streaming partial responses to UI
- Add per-query cache keys; short TTL; fallbacks on rate limits

**Recommended Suppliers:**
- Alchemy SDK for core data; CoinGecko for token prices
- Internal streaming via Next.js route handlers; optional queue later if needed
- **Note:** Defer to Post-V1 - adds complexity without v1 value

---

### 15. Reasoning Model Integration for Query Planning
**Status:** Deferred to Post-V1  
**Impact:** Significantly improved method selection, parameter construction, call ordering, and complex multi-step query handling

**Current State:**
- V1 uses `gpt-4o-mini` for single-pass query planning
- All API calls planned upfront, executed sequentially
- No feedback loop between execution and planning
- Struggles with complex queries requiring multi-step reasoning

**Problems a Reasoning Model Would Fix:**
- **Method Selection (60-70% improvement):** Better intent-to-method mapping (e.g., "how many holders" → `nft.getOwnersForContract` not `nft.getNftsForOwner`)
- **Parameter Construction (50-60% improvement):** Understands method signatures and required params correctly
- **Call Ordering & Dependencies (80-90% improvement):** Plans sequences like: resolve token symbol → get contract address → get metadata → get price
- **Complex Multi-Step Queries (70-80% improvement):** Breaks down queries like "who first bought BAYC?" into: resolve BAYC → get transfers → filter/sort → analyze
- **Context-Aware Planning (60-70% improvement):** Uses results from previous calls to inform next calls

**What It Wouldn't Fix:**
- Next.js/undici configuration issues (infrastructure)
- Schema validation errors (code-level)
- API rate limits (external constraints)
- Network failures (infrastructure)

**Action Items (Post-V1):**
- Evaluate reasoning models (o1, o3, or similar) for query planning
- Implement iterative planning: generate plan → execute first call → use results to plan next → repeat
- Hybrid approach: use reasoning model for complex queries, keep current approach for simple queries (faster/cheaper)
- Add confidence thresholds to determine when to use reasoning model vs standard planning

**Recommended Approach:**
- Start with reasoning model for low-confidence queries or complex multi-step queries
- Keep current `gpt-4o-mini` approach for simple V1 query types (address analysis, token price, NFT ownership)
- Gradually expand reasoning model usage as it proves value

**Note:** Defer to Post-V1 - adds cost/complexity without V1 value, but would significantly improve query accuracy and complex query support

---

## Implementation Priority

### V1 Phase (Current Focus)

**Core Features:**
1. ✅ Results page UX formatting
2. ✅ Error handling improvements
3. ✅ Input validation
4. ✅ Code cleanup (remove duplicates)
5. ✅ Remove scope abstraction - use apiCalls directly
6. ✅ Static token/NFT config (23 tokens + 22 NFT collections)
7. ✅ CoinGecko integration (token metadata, logos, current prices)
8. ✅ Token support expansion with static config
9. ✅ Homepage query examples (3-5 clickable examples for v1 query types)
10. ✅ Simplify AI prompt to only list v1 methods (remove complex intents)

**V1 Query Types (3 only):**
- **Address Analysis:** "What does 0x... hold?", "Balance of 0x...", "Analyze 0x..."
- **Token Price:** "Price of UNI", "What's PEPE worth?" (curated list only)
- **NFT Ownership:** "Does 0x... own BAYC?", "NFTs owned by 0x..." (curated collections only)

**V1 Simplifications:**
- Remove complex intents: `whale_tracking`, `profit_analysis`, `transaction_history`, `contract_interaction`, `airdrop_analysis`
- Keep only: `address_analysis`, `token_analysis`
- Hardcode common patterns instead of complex AI planning
- Focus on single-address queries only

### Post-V1 (If Demand Exists)

**Deferred Features:**
- Multi-address comparisons
- Transfer history queries ("Did 0x... send ETH to 0x...?")
- Token holder queries ("Top 10 USDC holders")
- NFT holder queries ("cryptopunks holders")
- Time-scoped transfer analytics (11)
- Full Trade PnL (13)
- Orchestration & streaming (14)
- Reasoning model integration (15) - iterative planning with feedback loops
- Rate limiting (9)
- Missing loading states between pages (9)
- Sequential token metadata fetching optimization (10)
- NFT ownership analytics (12)
- Dynamic NFT collection resolution (12.5) - OpenSea/Reservoir fallback
- Etherscan API integration

**Not Planned:**
- Bitquery integration (removed - maintenance burden)
- Historical price charts
- Multi-chain support
- Arbitrary token/collection lookups

