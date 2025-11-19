import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { resolveTokenSymbol, resolveTokenSymbols } from "@/utils/token-resolver"
import { resolveNFTCollection } from "@/utils/nft-resolver"
import { getFormattedMethodList } from "@/utils/alchemy-allowlist"

// AI Agent Schema
export const QueryPlanSchema = z.object({
  intent: z.enum([
    "address_analysis",
    "token_analysis",
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
      params: z.array(z.union([
        z.string(), 
        z.number(), 
        z.object({}).passthrough(),
        z.array(z.union([z.string(), z.number(), z.object({}).passthrough()])) // Allow arrays for alchemy_call format: [methodPath, [actualParams]]
      ])),
      purpose: z.string(),
      priority: z.number().optional(),
    }),
  ),
  reasoning: z.string(),
})

export async function createQueryPlan(query: string) {
  // Extract data before try/catch so it's available in fallback
  const extractedTokens: string[] = []
  const extractedContractAddresses: string[] = []
  const extractedNFTCollections: string[] = []
  
  // Extract NFT collection names (common patterns) - do this before try/catch
  const nftPatterns = [
    /\b(BAYC|MAYC|Pudgy Penguins|Azuki|Milady|CryptoPunks|DeGods|Moonbirds|Doodles|CloneX|Checks|Mfers|Cool Cats|World of Women|Meebits|VeeFriends|Art Blocks|Autoglyphs|Loot|Nouns|Goblintown|Pudgy Rodents)\b/gi,
  ]
  
  for (const pattern of nftPatterns) {
    const matches = query.match(pattern)
    if (matches) {
      for (const match of matches) {
        const resolved = resolveNFTCollection(match)
        if (resolved) {
          extractedNFTCollections.push(resolved.address)
        }
      }
    }
  }
  
  try {
    console.log("🤖 Planning query with AI:", query)

    const processedQuery = query

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

    const plan = await generateObject({
      model: openai("gpt-4o-mini"),
      mode: "tool", // Use tool/function calling mode for structured output
      prompt: `You are 0xHunter, an expert blockchain analyst. Analyze this query: "${processedQuery}"

Available API Methods:
Use alchemy_call(methodPath, params) to call any Alchemy SDK method:

${getFormattedMethodList()}

Planning Rules:
- Intent must be one of: "address_analysis" (for address/NFT queries), "token_analysis" (for token price queries), or "unknown"
- Use ACTUAL addresses from extractedData.addresses (not placeholders)
- For token price queries ("price of X", "what is X worth"), use intent "token_analysis" and alchemy_call("core.getTokenMetadata", [contractAddress]) with contractAddress from extractedData.contractAddresses (no address needed)
- For NFT ownership queries ("does X own BAYC", "NFTs owned by X"), use intent "address_analysis" and alchemy_call("nft.getNftsForOwner", [ownerAddress, {contractAddresses: [collectionAddress]}]) when a specific collection is requested
- For NFT holder queries ("how many BAYC holders", "top holders"), use alchemy_call("nft.getOwnersForContract", [contractAddress])
- For transfer history queries ("who bought X", "recent transfers"), use alchemy_call("core.getAssetTransfers", [params]) with appropriate filters
- V1 limitation: Only single-address queries supported for address analysis (no multi-address comparisons)`,
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

    console.log("✅ AI plan generated:", JSON.stringify(planWithExtracted, null, 2))
    return planWithExtracted
  } catch (error) {
    console.error("❌ AI planning failed:", error)

    // Enhanced fallback detection
    const addressMatch = query.match(/0x[a-fA-F0-9]{40}/)
    const tokenMatch = query.match(/\$([A-Z]{2,10})/i)
    
    // Check for NFT mentions in query
    const nftKeywords = ["nft", "nfts", "collection", "owns", "own", "has", "hold", "holds"]
    const hasNFTKeywords = nftKeywords.some(keyword => query.toLowerCase().includes(keyword))
    const hasNFTCollections = extractedNFTCollections.length > 0

    if (addressMatch) {
      const apiCalls: any[] = [
        { method: "eth_getBalance", params: [addressMatch[0], "latest"], purpose: "balance" },
        { method: "eth_getTransactionCount", params: [addressMatch[0], "latest"], purpose: "transactionCount" },
        { method: "alchemy_getTokenBalances", params: [addressMatch[0]], purpose: "tokenBalances" },
      ]
      
      // Include NFT call if NFT keywords or collections detected
      if (hasNFTKeywords || hasNFTCollections) {
        // Use new method format with collection filter if available
        if (hasNFTCollections && extractedNFTCollections.length > 0) {
          apiCalls.push({
            method: "nft.getNftsForOwner",
            params: [addressMatch[0], { contractAddresses: extractedNFTCollections }],
            purpose: "nfts",
          })
        } else {
          apiCalls.push({
            method: "nft.getNftsForOwner",
            params: [addressMatch[0]],
            purpose: "nfts",
          })
        }
      }
      
      return {
        intent: "address_analysis" as const,
        confidence: 0.7,
        extractedData: {
          addresses: [addressMatch[0]],
          nftCollections: hasNFTCollections ? extractedNFTCollections : undefined,
        },
        apiCalls,
        reasoning: "Fallback address detection",
      }
    }

    if (tokenMatch) {
      return {
        intent: "token_analysis" as const,
        confidence: 0.6,
        extractedData: { tokens: [tokenMatch[1]] },
        apiCalls: [],
        reasoning: "Fallback token detection",
      }
    }

    return {
      intent: "unknown" as const,
      confidence: 0,
      extractedData: {},
      apiCalls: [],
      reasoning: "No fallback pattern matched",
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
