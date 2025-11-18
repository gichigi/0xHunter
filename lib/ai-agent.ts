import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { resolveTokenSymbol, resolveTokenSymbols } from "@/utils/token-resolver"
import { resolveNFTCollection } from "@/utils/nft-resolver"

// AI Agent Schema
export const QueryPlanSchema = z.object({
  intent: z.enum([
    "address_analysis",
    "token_analysis",
    "whale_tracking",
    "transaction_history",
    "profit_analysis",
    "contract_interaction",
    "airdrop_analysis",
    "unknown",
  ]),
  confidence: z.number().min(0).max(1),
  extractedData: z
    .object({
      addresses: z.array(z.string()).optional(),
      tokens: z.array(z.string()).optional(),
      contractAddresses: z.array(z.string()).optional(),
      nftCollections: z.array(z.string()).optional(),
      amounts: z.array(z.string()).optional(),
      timeframes: z.array(z.string()).optional(),
    })
    .optional(),
  apiCalls: z.array(
    z.object({
      method: z.string(),
      params: z.array(z.union([z.string(), z.number(), z.object({}).passthrough()])),
      purpose: z.string(),
      priority: z.number().optional(),
    }),
  ),
  reasoning: z.string(),
  hunterCommentary: z.string(),
})

export async function createQueryPlan(query: string) {
  try {
    console.log("🤖 Planning query with AI:", query)

    const processedQuery = query
    const extractedTokens: string[] = []
    const extractedContractAddresses: string[] = []
    const extractedNFTCollections: string[] = []

    // Extract token symbols from query (look for $SYMBOL or SYMBOL patterns)
    const tokenPattern = /\$([A-Z]{2,10})\b|(?<!\$)\b([A-Z]{2,10})\b/gi
    const tokenMatches = [...processedQuery.matchAll(tokenPattern)]
    const potentialTokens = new Set<string>()
    
    for (const match of tokenMatches) {
      const symbol = (match[1] || match[2])?.toUpperCase()
      if (symbol && symbol.length >= 2 && symbol.length <= 10) {
        potentialTokens.add(symbol)
      }
    }

    // Resolve tokens in parallel
    if (potentialTokens.size > 0) {
      const resolvedTokens = await resolveTokenSymbols(Array.from(potentialTokens))
      for (const [symbol, tokenInfo] of resolvedTokens.entries()) {
        extractedTokens.push(symbol)
        extractedContractAddresses.push(tokenInfo.address)
      }
    }

    // Extract NFT collection names (common patterns)
    const nftPatterns = [
      /\b(BAYC|MAYC|Pudgy Penguins|Azuki|Milady|CryptoPunks|DeGods|Moonbirds|Doodles|CloneX|Checks|Mfers|Cool Cats|World of Women|Meebits|VeeFriends|Art Blocks|Autoglyphs|Loot|Nouns|Goblintown|Pudgy Rodents)\b/gi,
    ]
    
    for (const pattern of nftPatterns) {
      const matches = processedQuery.match(pattern)
      if (matches) {
        for (const match of matches) {
          const resolved = resolveNFTCollection(match)
          if (resolved) {
            extractedNFTCollections.push(resolved.address)
          }
        }
      }
    }

    const plan = await generateObject({
      model: openai("gpt-4o-mini"),
      mode: "tool", // Use tool/function calling mode for structured output
      prompt: `You are The Hunter, an expert blockchain analyst. Analyze this query: "${processedQuery}"

Available Alchemy API methods and their parameters:

1. **eth_getBalance**:
   * Purpose: Get ETH balance for an address.
   * Params: \`[string_address, string_blockParameter_default_latest]\`
   * Example: \`["0x...", "latest"]\`

2. **eth_getTransactionCount**:
   * Purpose: Get transaction count for an address.
   * Params: \`[string_address, string_blockParameter_default_latest]\`
   * Example: \`["0x...", "latest"]\`

3. **alchemy_getTokenBalances**:
   * Purpose: Get all ERC-20 tokens for an address.
   * Params: \`[string_address]\`
   * Example: \`["0x..."]\`

4. **alchemy_getTokenMetadata**:
   * Purpose: Get token information by contract address.
   * Params: \`[string_contractAddress]\`
   * Example: \`["0x..."]\`

5. **alchemy_getAssetTransfers**:
   * Purpose: Get transaction history and transfers.
   * Params: \`[object_params]\`
   * Example: \`[{ fromBlock: "0x1", toBlock: "latest", fromAddress: "0x...", category: "external" }]\`

6. **alchemy_getNFTs**:
   * Purpose: Get NFT collection.
   * Params: \`[object_params]\`
   * Example: \`[{ owner: "0x...", withMetadata: true }]\`

7. **eth_getLogs**:
   * Purpose: Get contract events and logs.
   * Params: \`[object_params]\`
   * Example: \`[{ address: "0x...", fromBlock: "0x1", toBlock: "latest" }]\`

Query Type Detection:
- ADDRESS_ANALYSIS: Contains 0x... address → analyze wallet
- TOKEN_ANALYSIS: Contains $TOKEN or token name → find token info
- WHALE_TRACKING: "whale", "large holders" → find big wallets
- TRANSACTION_HISTORY: "bought", "sold", "transactions" → get history
- PROFIT_ANALYSIS: "profit", "gains", "best trade" → analyze P&L
- CONTRACT_INTERACTION: "contract", "dapp" → analyze smart contracts
- AIRDROP_ANALYSIS: "airdrop", "eligible" → check airdrops

API Call Planning:
You must specify EXACT apiCalls needed based on the query. Use the ACTUAL addresses from extractedData.addresses, not placeholders.

Examples (replace ADDRESS_PLACEHOLDER with actual address from extractedData):

Simple balance query ("ETH balance of 0x123..."):
- apiCalls: [{ method: "eth_getBalance", params: ["0x123...", "latest"], purpose: "balance" }]

Basic wallet analysis ("analyze 0x123...", "what does 0x123... hold"):
- apiCalls: [
    { method: "eth_getBalance", params: ["0x123...", "latest"], purpose: "balance" },
    { method: "eth_getTransactionCount", params: ["0x123...", "latest"], purpose: "transactionCount" },
    { method: "alchemy_getTokenBalances", params: ["0x123..."], purpose: "tokenBalances" }
  ]

Full wallet analysis ("full analysis of 0x123...", "everything about 0x123...", "NFTs owned by 0x123..."):
- apiCalls: [
    { method: "eth_getBalance", params: ["0x123...", "latest"], purpose: "balance" },
    { method: "eth_getTransactionCount", params: ["0x123...", "latest"], purpose: "transactionCount" },
    { method: "alchemy_getTokenBalances", params: ["0x123..."], purpose: "tokenBalances" },
    { method: "alchemy_getNFTs", params: [{ owner: "0x123...", withMetadata: true }], purpose: "nfts" }
  ]

Transfer history ("transfers from 0x123...", "when did 0x123... buy PEPE"):
- apiCalls: [
    { method: "alchemy_getAssetTransfers", params: [{ fromAddress: "0x123...", category: ["external", "erc20", "erc721", "erc1155"] }], purpose: "transfers" }
  ]

IMPORTANT: 
- Use ACTUAL addresses from extractedData.addresses in your apiCalls params
- Specify ONLY the apiCalls needed to answer the query
- For comparison queries with multiple addresses, use minimal apiCalls (just balance) to avoid slow calls
- Each apiCall must have a unique "purpose" that matches what data it provides

Extract key data and set confidence (0-1).

Write mysterious Hunter commentary matching the query type.`,
      schema: QueryPlanSchema,
    })

    // Add extracted data to plan
    const planWithExtracted = {
      ...plan.object,
      extractedData: {
        ...plan.object.extractedData,
        tokens: extractedTokens.length > 0 ? extractedTokens : plan.object.extractedData?.tokens,
        contractAddresses: extractedContractAddresses.length > 0 ? extractedContractAddresses : plan.object.extractedData?.contractAddresses,
        nftCollections: extractedNFTCollections.length > 0 ? extractedNFTCollections : plan.object.extractedData?.nftCollections,
      },
    }

    console.log("✅ AI plan generated:", planWithExtracted)
    return planWithExtracted
  } catch (error) {
    console.error("❌ AI planning failed:", error)

    // Enhanced fallback detection
    const addressMatch = query.match(/0x[a-fA-F0-9]{40}/)
    const tokenMatch = query.match(/\$([A-Z]{2,10})/i)

    if (addressMatch) {
      return {
        intent: "address_analysis" as const,
        confidence: 0.7,
        extractedData: { addresses: [addressMatch[0]] },
        apiCalls: [
          { method: "eth_getBalance", params: [addressMatch[0], "latest"], purpose: "balance" },
          { method: "eth_getTransactionCount", params: [addressMatch[0], "latest"], purpose: "transactionCount" },
          { method: "alchemy_getTokenBalances", params: [addressMatch[0]], purpose: "tokenBalances" },
        ],
        reasoning: "Fallback address detection",
        hunterCommentary: "The AI spirits are silent, but The Hunter's eyes still see the address...",
      }
    }

    if (tokenMatch) {
      return {
        intent: "token_analysis" as const,
        confidence: 0.6,
        extractedData: { tokens: [tokenMatch[1]] },
        apiCalls: [],
        reasoning: "Fallback token detection",
        hunterCommentary: `The ${tokenMatch[1]} token calls from the shadows, but the path remains unclear...`,
      }
    }

    return {
      intent: "unknown" as const,
      confidence: 0,
      extractedData: {},
      apiCalls: [],
      reasoning: "No fallback pattern matched",
      hunterCommentary: "The digital mists are too thick. Even The Hunter cannot pierce this veil...",
    }
  }
}

export const ALCHEMY_METHODS = {
  eth_getBalance: (address: string) => [address, "latest"],
  eth_getTransactionCount: (address: string) => [address, "latest"],
  alchemy_getTokenBalances: (address: string) => [address],
  alchemy_getTokenMetadata: (contractAddress: string) => [contractAddress],
  alchemy_getAssetTransfers: (params: any) => [params],
  alchemy_getNftsForOwner: (ownerAddress: string) => [{ owner: ownerAddress, pageSize: 20 }],
  eth_getLogs: (params: any) => [params],
}
