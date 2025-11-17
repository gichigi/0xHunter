# 0xHunter Roadmap

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

## Medium Priority Issues

### 5. Duplicate/Unused Code
**Status:** Not Started  
**Impact:** Code bloat, confusion about which code to use

**Current State:**
- `lib/ai-agent.ts` exists but unused
- Logic duplicated in `app/api/search/route.ts`

**Action Items:**
- Consolidate AI agent logic in one place
- Use `lib/ai-agent.ts` or remove it
- Refactor API route to use shared utilities

---

### 6. No Input Validation
**Status:** Not Started  
**Impact:** Invalid queries hit API, waste resources, poor error messages

**Current State:**
- No Ethereum address format validation
- No query length/sanity checks

**Action Items:**
- Validate Ethereum addresses (0x + 40 hex chars)
- Validate query length (min/max)
- Add helpful validation error messages
- Client-side validation before API call

---

### 7. Limited Token Support
**Status:** Not Started  
**Impact:** Only recognizes 3 tokens (USDC, PEPE, DOGE)

**Current State:**
- Hardcoded `KNOWN_TOKEN_CONTRACTS` in `app/api/search/route.ts:41-45`

**Action Items:**
- Expand token database or use external API
- Support more common tokens
- Consider token discovery via Alchemy metadata

---

### 8. No Rate Limiting
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

## Implementation Priority

1. **Phase 1 (Immediate):**
   - Results page UX formatting
   - Error handling improvements
   - Input validation

2. **Phase 2 (Short-term):**
   - Real-time ETH price
   - Shareable results (URL params)
   - Code cleanup (remove duplicates)

3. **Phase 3 (Long-term):**
   - Rate limiting
   - Expanded token support
   - Performance optimizations

