import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

// Enhanced schema for more sophisticated planning
export const QueryPlanSchema = z.object({
  intent: z.enum([
    "address_analysis",
    "token_holdings",
    "transaction_history",
    "token_transfers",
    "whale_tracking",
    "profit_analysis",
    "contract_interaction",
    "unknown",
  ]),
  confidence: z.number().min(0).max(1),
  extractedData: z.object({
    addresses: z.array(z.string()).optional(),
    tokens: z.array(z.string()).optional(),
    amounts: z.array(z.string()).optional(),
    timeframes: z.array(z.string()).optional(),
  }),
  apiCalls: z.array(
    z.object({
      method: z.string(),
      params: z.any(),
      purpose: z.string(),
      priority: z.number(),
    }),
  ),
  reasoning: z.string(),
  hunterCommentary: z.string(),
})

export async function createQueryPlan(query: string) {
  const plan = await generateObject({
    model: openai("gpt-4o-mini"),
    mode: "json", // Explicitly set JSON mode for structured output
    prompt: `You are The Hunter, a mysterious blockchain analyst. Analyze this query: "${query}"
    
    Based on the query, determine:
    1. The intent (address_analysis, token_analysis, whale_tracking, etc.)
    2. What data to extract (addresses, tokens, amounts, timeframes)
    3. Your confidence level (0-1)
    4. Which API functions to call and in what order
    5. Mysterious Hunter commentary for the results page
    
    Available functions:
    - get_eth_balance: Get ETH balance for an address
    - get_transaction_count: Get transaction count for an address  
    - get_token_balances: Get all ERC-20 tokens for an address
    - get_token_metadata: Get token information by contract address
    - get_asset_transfers: Get transaction history and transfers
    - get_nfts_for_owner: Get NFT collection for an owner
    - get_contract_logs: Get contract events and logs
    
    For address analysis, typically call: get_eth_balance, get_transaction_count, get_token_balances, get_nfts_for_owner
    
    Generate mysterious Hunter commentary matching the query type:
    - Address analysis: "The trail leads to a specific den. Let's see what secrets it holds."
    - Token analysis: "A whisper of a token echoes through the forest. Who truly commands its flow?"
    - Whale tracking: "Giants stir in the depths. Their movements ripple across the entire chain."`,
    schema: QueryPlanSchema,
  })

  return plan
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
