# Query Types → Data Needs → API Mapping

## Purpose
Map query types to their data requirements, then to APIs that can fulfill them. Identify APIs that support the most queries (efficiency).

---

## Query Type Categories

### 1. WALLET QUERIES (Address-Centric)

#### 1.1 Current State Queries
**What they ask:** "What does this wallet hold right now?"

**Examples:**
- "What does 0x... hold?"
- "Show me tokens in 0x..."
- "NFTs owned by 0x..."
- "Balance of 0x..."

**Data Needs:**
- ETH balance
- ERC-20 token balances
- NFT holdings
- Transaction count (for context)

**APIs:**
- ✅ Alchemy: `getBalance()`, `getTokenBalances()`, `getNftsForOwner()`, `getTransactionCount()`
- ❌ CoinGecko: Not needed (on-chain data only)
- ❌ Static config: Not needed

**Coverage:** 100% Alchemy

---

#### 1.2 Comparison Queries
**What they ask:** "Compare multiple wallets"

**Examples:**
- "Compare 0x... and 0x..."
- "Which wallet has more ETH?"
- "Top 5 wallets by balance"

**Data Needs:**
- ETH balances (multiple addresses)
- Token holdings (multiple addresses)
- Aggregation/comparison logic

**APIs:**
- ✅ Alchemy: `getBalance()` (multiple calls), `getTokenBalances()` (multiple calls)
- ❌ CoinGecko: Not needed
- ❌ Static config: Not needed

**Coverage:** 100% Alchemy

---

#### 1.3 Historical State Queries
**What they ask:** "What did this wallet hold/do in the past?"

**Examples:**
- "Did 0x... ever hold BAYC?"
- "When did 0x... buy PEPE?"
- "Has 0x... ever sold USDC?"

**Data Needs:**
- Transfer history (ERC-20, ERC-721, ERC-1155)
- Transaction history
- Time-stamped events
- Token/collection filters

**APIs:**
- ✅ Alchemy: `getAssetTransfers()` (with filters, pagination)
- ❌ CoinGecko: Not needed
- ⚠️ Static config: Needed to filter by known tokens/collections

**Coverage:** 100% Alchemy (with static config for filtering)

---

#### 1.4 Transfer Pattern Queries
**What they ask:** "What patterns exist in this wallet's activity?"

**Examples:**
- "Largest transfer from 0x..."
- "Did 0x... send ETH to 0x...?"
- "Repeat buyers/sellers"
- "Inflow/outflow patterns"

**Data Needs:**
- Transfer history (all types)
- Aggregation (sums, counts, patterns)
- Time-based analysis

**APIs:**
- ✅ Alchemy: `getAssetTransfers()` (with category filters)
- ❌ CoinGecko: Not needed
- ⚠️ Static config: Needed for token/collection filtering

**Coverage:** 100% Alchemy

---

### 2. TOKEN QUERIES (Token-Centric)

#### 2.1 Token Metadata Queries
**What they ask:** "Tell me about this token"

**Examples:**
- "What is UNI?"
- "Price of PEPE"
- "Show me USDC logo"
- "Token info for $LINK"

**Data Needs:**
- Token name, symbol
- Token logo/image
- Current price (USD)
- Contract address

**APIs:**
- ✅ CoinGecko: `searchToken()`, `getTokenMetadataByAddress()`, `getTokenPriceByAddress()`
- ⚠️ Alchemy: `getTokenMetadata()` (requires address, no search by symbol)
- ⚠️ Static config: Can provide address lookup for known tokens

**Coverage:** 
- Symbol → Address: CoinGecko (primary) + Static config (fallback)
- Metadata: CoinGecko (logos, prices) + Alchemy (on-chain metadata)
- **Efficiency:** CoinGecko covers most needs, Alchemy for on-chain validation

---

#### 2.2 Token Holder Queries
**What they ask:** "Who holds this token?"

**Examples:**
- "Top 10 USDC holders"
- "Who holds the most PEPE?"
- "Addresses with >1000 UNI"

**Data Needs:**
- Token balances across all holders
- Aggregation (top N, filtering by amount)
- Holder addresses

**APIs:**
- ❌ Alchemy: Does NOT support "all holders of token X" (only "tokens held by address X")
- ❌ CoinGecko: Does NOT support holder data
- ⚠️ **Problem:** This requires indexed data (Etherscan, Dune, etc.)

**Coverage:** 0% with current APIs
**Solution:** Defer to Post-MVP or use Etherscan API (if needed)

---

#### 2.3 Token Transfer Queries
**What they ask:** "What transfers happened for this token?"

**Examples:**
- "Recent USDC transfers"
- "Largest PEPE transfers today"
- "Who received UNI in the last week?"

**Data Needs:**
- Transfer history filtered by token contract
- Time-based filtering
- Amount filtering

**APIs:**
- ✅ Alchemy: `getAssetTransfers()` (with `contractAddresses` filter)
- ❌ CoinGecko: Not needed
- ⚠️ Static config: Needed to map symbol → address

**Coverage:** 100% Alchemy (with static config for symbol resolution)

---

### 3. NFT QUERIES (Collection-Centric)

#### 3.1 NFT Metadata Queries
**What they ask:** "Tell me about this NFT collection"

**Examples:**
- "What is Azuki?"
- "Show me BAYC collection"
- "NFTs in Pudgy Penguins"

**Data Needs:**
- Collection name, description
- Collection image/logo
- Total supply
- Floor price (optional, requires external API)

**APIs:**
- ✅ Alchemy: `getNftsForOwner()` returns collection metadata
- ⚠️ CoinGecko: Has NFT data but limited
- ⚠️ Static config: Can provide collection addresses

**Coverage:** 80% Alchemy, 20% Static config

---

#### 3.2 NFT Ownership Queries
**What they ask:** "Who owns NFTs from this collection?"

**Examples:**
- "Top Azuki holders"
- "Who owns the most BAYC?"
- "Addresses with Pudgy Penguins"

**Data Needs:**
- NFT ownership per collection
- Aggregation (count per owner)
- Owner addresses

**APIs:**
- ✅ Alchemy: `getOwnersForContract()` (supports this!)
- ❌ CoinGecko: Does NOT support ownership data
- ⚠️ Static config: Needed to map collection name → address

**Coverage:** 100% Alchemy (with static config for name resolution)

---

#### 3.3 NFT Transfer Queries
**What they ask:** "What NFT transfers happened?"

**Examples:**
- "Recent BAYC sales"
- "Who bought Azuki NFTs?"
- "NFT transfers to 0x..."

**Data Needs:**
- Transfer history (ERC-721, ERC-1155)
- Filtered by collection
- Time-based filtering

**APIs:**
- ✅ Alchemy: `getAssetTransfers()` (with `category: ["erc721", "erc1155"]` and `contractAddresses`)
- ❌ CoinGecko: Not needed
- ⚠️ Static config: Needed for collection name → address

**Coverage:** 100% Alchemy

---

### 4. PROFITABILITY QUERIES (P&L Analysis)

#### 4.1 Simple P&L Queries
**What they ask:** "Did this wallet profit from trades?"

**Examples:**
- "Most profitable trade by 0x..."
- "Did 0x... profit from PEPE?"
- "Best trade this wallet made"

**Data Needs:**
- Transfer history (buys/sells)
- Token prices at time of transfer
- Cost basis calculation
- Profit/loss calculation

**APIs:**
- ✅ Alchemy: `getAssetTransfers()` (transfer history)
- ⚠️ CoinGecko: Current price only (not historical)
- ❌ **Problem:** Need historical prices at specific timestamps

**Coverage:** 50% Alchemy (transfers), 0% price history
**Solution:** Use current price for rough estimates (MVP), defer historical to Post-MVP

---

#### 4.2 Trade Detection Queries
**What they ask:** "What trades did this wallet make?"

**Examples:**
- "All swaps by 0x..."
- "DEX trades for UNI"
- "Token swaps in last month"

**Data Needs:**
- DEX swap detection (event logs)
- Token pairs
- Amounts
- Timestamps

**APIs:**
- ✅ Alchemy: `getLogs()` (DEX event logs), `getAssetTransfers()` (can infer swaps)
- ❌ CoinGecko: Not needed
- ⚠️ Static config: Needed for token addresses

**Coverage:** 100% Alchemy (with ABI decoding for swap detection)

---

### 5. RELATIONSHIP QUERIES (Address-to-Address)

#### 5.1 Direct Transfer Queries
**What they ask:** "Did these addresses interact?"

**Examples:**
- "Did 0x... send ETH to 0x...?"
- "Transfers between 0x... and 0x..."
- "Has 0x... ever received from 0x...?"

**Data Needs:**
- Transfer history
- Filtered by from/to addresses
- Time-based filtering

**APIs:**
- ✅ Alchemy: `getAssetTransfers()` (with `fromAddress`/`toAddress` filters)
- ❌ CoinGecko: Not needed
- ❌ Static config: Not needed

**Coverage:** 100% Alchemy

---

## API Efficiency Analysis

### Alchemy API Coverage

**Supports:**
- ✅ All wallet state queries (100%)
- ✅ All transfer/transaction queries (100%)
- ✅ NFT ownership queries (100%)
- ✅ NFT transfer queries (100%)
- ✅ Token transfer queries (100%)
- ✅ Trade detection (100% with logs)
- ✅ Relationship queries (100%)

**Does NOT Support:**
- ❌ Token holder queries ("who holds token X")
- ❌ Token symbol → address lookup (needs contract address)
- ❌ Historical prices
- ❌ Token logos/images
- ❌ Current token prices

**Coverage Score:** 85% of query types

---

### CoinGecko API Coverage

**Supports:**
- ✅ Token symbol → address lookup (search)
- ✅ Token metadata (name, symbol, logo)
- ✅ Current token prices
- ⚠️ Limited NFT data

**Does NOT Support:**
- ❌ On-chain data (balances, transfers, transactions)
- ❌ Historical prices (free tier)
- ❌ Token holder data
- ❌ NFT ownership data
- ❌ Transfer history

**Coverage Score:** 15% of query types (but critical for token metadata)

---

### Static Config Coverage

**Supports:**
- ✅ Token symbol → address (for known tokens)
- ✅ NFT collection name → address (for known collections)
- ✅ Fast lookups (no API calls)

**Does NOT Support:**
- ❌ Unknown tokens/collections
- ❌ Dynamic data
- ❌ Prices/metadata

**Coverage Score:** 5% (but enables other queries)

---

## API Integration Priority (Efficiency)

### Tier 1: Must Have (Covers Most Queries)

**1. Alchemy API** ⭐⭐⭐⭐⭐
- **Coverage:** 85% of query types
- **Why:** Core on-chain data engine
- **Queries Supported:** Wallet state, transfers, NFTs, transactions, relationships
- **Maintenance:** Low (stable API)

**2. CoinGecko API** ⭐⭐⭐⭐
- **Coverage:** 15% of query types (but critical gap)
- **Why:** Token metadata, symbol resolution, current prices
- **Queries Supported:** Token info, symbol lookup, prices
- **Maintenance:** Low (stable API, free tier sufficient)

### Tier 2: Nice to Have (Post-MVP)

**3. Static Config Files**
- **Coverage:** Enables 20% of queries (by providing addresses)
- **Why:** Fast lookups, reduces API calls
- **Maintenance:** Medium (periodic updates needed)

**4. Etherscan API** (if token holder queries needed)
- **Coverage:** 5% of query types
- **Why:** Token holder data (Alchemy doesn't support)
- **Maintenance:** Medium (rate limits, API key needed)

---

## Query Type → API Mapping Summary

| Query Category | Primary API | Secondary API | Static Config |
|---------------|-------------|---------------|---------------|
| Wallet State | Alchemy | - | - |
| Wallet Comparison | Alchemy | - | - |
| Historical State | Alchemy | - | ✅ (filtering) |
| Transfer Patterns | Alchemy | - | ✅ (filtering) |
| Token Metadata | CoinGecko | Alchemy | ✅ (address lookup) |
| Token Holders | ❌ None | Etherscan (Post-MVP) | - |
| Token Transfers | Alchemy | - | ✅ (address lookup) |
| NFT Metadata | Alchemy | - | ✅ (address lookup) |
| NFT Ownership | Alchemy | - | ✅ (address lookup) |
| NFT Transfers | Alchemy | - | ✅ (address lookup) |
| Simple P&L | Alchemy | CoinGecko (current price) | ✅ (address lookup) |
| Trade Detection | Alchemy | - | ✅ (address lookup) |
| Relationships | Alchemy | - | - |

---

## Recommendations

### MVP API Stack (Optimal)

1. **Alchemy** (Primary)
   - Handles 85% of queries
   - All on-chain data
   - Stable, reliable

2. **CoinGecko** (Secondary)
   - Fills critical gap (token metadata)
   - Free tier sufficient
   - Stable API

3. **Static Config** (Enabler)
   - Top 25 tokens + Top 25 NFT collections
   - Enables symbol/name → address resolution
   - Reduces API calls

### APIs NOT Needed for MVP

- ❌ **Bitquery** - Historical prices not needed for MVP
- ❌ **Etherscan** - Token holder queries can wait
- ❌ **Reservoir** - NFT sales data not critical for MVP
- ❌ **Dune/Flipside** - Overkill for MVP

### Efficiency Score

**Current Stack (Alchemy + CoinGecko + Static Config):**
- Covers: **95% of MVP query types**
- Missing: Token holder queries (5%) - defer to Post-MVP
- Maintenance: **Low** (2 stable APIs + static file)

**Optimal for MVP:** ✅ Current approach is correct

