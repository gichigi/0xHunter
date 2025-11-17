import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

// AI Agent Schema
const QueryPlanSchema = z.object({
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

// Known contract addresses
const KNOWN_TOKEN_CONTRACTS: Record<string, string> = {
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  PEPE: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
  DOGE: "0xba2ae424d960c26247dd6c32edc70b295c744C43",
}

async function planQuery(query: string) {
  try {
    console.log("🤖 Planning query with AI:", query)

    const processedQuery = query
    const extractedTokens: string[] = []
    const extractedContractAddresses: string[] = []

    for (const tokenSymbol in KNOWN_TOKEN_CONTRACTS) {
      const regex = new RegExp(`\\$${tokenSymbol}|${tokenSymbol}`, "gi")
      if (regex.test(processedQuery)) {
        extractedTokens.push(tokenSymbol)
        extractedContractAddresses.push(KNOWN_TOKEN_CONTRACTS[tokenSymbol])
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
- ADDRESS_ANALYSIS: balance + txCount + tokenBalances + NFTs
- TOKEN_ANALYSIS: getAssetTransfers + getTokenMetadata
- WHALE_TRACKING: getAssetTransfers with filters
- TRANSACTION_HISTORY: getAssetTransfers with filters
- PROFIT_ANALYSIS: getAssetTransfers + metadata

Extract key data and set confidence (0-1).

Write mysterious Hunter commentary matching the query type.`,
      schema: QueryPlanSchema,
    })

    console.log("✅ AI plan generated:", plan)
    return plan.object
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

async function executeApiCall(method: string, params: any[], apiKey: string) {
  const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`

  try {
    console.log(`🔗 Executing ${method} with params:`, params)

    const response = await fetch(alchemyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: method,
        params: params,
        id: Math.floor(Math.random() * 1000),
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error(`❌ Alchemy error for ${method}:`, data.error)
      return null
    }

    console.log(`✅ ${method} successful`)
    return data.result
  } catch (error) {
    console.error(`❌ API call ${method} failed:`, error)
    return null
  }
}

async function processAddressAnalysis(address: string, apiResults: any, apiKey: string) {
  try {
    console.log("🔍 Processing address analysis for:", address)

    const balance = apiResults.balance
    const balanceWei = balance ? Number.parseInt(balance, 16) : 0
    const balanceEth = balanceWei / Math.pow(10, 18)

    const txCount = apiResults.transactionCount
    const txCountNum = txCount ? Number.parseInt(txCount, 16) : 0

    const tokenBalances = apiResults.tokenBalances?.tokenBalances || []
    const significantTokens = tokenBalances.filter((token: any) => {
      try {
        const bal = Number.parseInt(token.tokenBalance, 16)
        return bal > 0
      } catch {
        return false
      }
    })

    const tokensWithMetadata = await Promise.all(
      significantTokens.slice(0, 10).map(async (token: any) => {
        const metadata = await executeApiCall("alchemy_getTokenMetadata", [token.contractAddress], apiKey)
        return {
          ...token,
          name: metadata?.name || "Unknown Token",
          symbol: metadata?.symbol || "???",
          decimals: metadata?.decimals || 18,
        }
      }),
    )

    const meaningfulTokens = tokensWithMetadata
      .filter((token: any) => {
        const formatted = getTokenNumericValue(token.tokenBalance, token.decimals)
        return formatted > 0.0001
      })
      .sort((a: any, b: any) => {
        const balanceA = getTokenNumericValue(a.tokenBalance, a.decimals)
        const balanceB = getTokenNumericValue(b.tokenBalance, b.decimals)
        return balanceB - balanceA
      })

    const isWhale = balanceEth > 100
    const isActive = txCountNum > 100

    const tags = []
    if (isWhale) tags.push("whale")
    if (isActive) tags.push("active")
    if (txCountNum > 1000) tags.push("heavy-trader")
    if (meaningfulTokens.length > 0) tags.push("token-collector")
    if (meaningfulTokens.length > 10) tags.push("diversified")

    return {
      address,
      shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
      profit: `${balanceEth.toFixed(4)} ETH`,
      profitUsd: balanceEth * 3500,
      transactions: txCountNum,
      status: txCountNum > 0 ? "active" : "inactive",
      risk: isWhale ? "low" : balanceEth > 1 ? "medium" : "high",
      tags,
      tokenHoldings: meaningfulTokens.map((token: any) => ({
        symbol: token.symbol,
        name: token.name,
        balance: formatTokenBalance(token.tokenBalance, token.decimals),
        contractAddress: token.contractAddress,
      })),
    }
  } catch (error) {
    console.error("❌ Address analysis processing failed:", error)
    return null
  }
}

function formatTokenBalance(balance: string, decimals = 18): string {
  try {
    const balanceNum = Number.parseInt(balance, 16)
    const formatted = balanceNum / Math.pow(10, decimals)

    if (formatted === 0) return "0"
    if (formatted < 0.0001) return "<0.0001"
    if (formatted < 1) return formatted.toFixed(4)
    if (formatted < 1000) return formatted.toFixed(2)
    if (formatted < 1000000) return (formatted / 1000).toFixed(1) + "K"
    return (formatted / 1000000).toFixed(1) + "M"
  } catch {
    return "0"
  }
}

function getTokenNumericValue(balance: string, decimals = 18): number {
  try {
    const balanceNum = Number.parseInt(balance, 16)
    return balanceNum / Math.pow(10, decimals)
  } catch {
    return 0
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    console.log("🔍 AI-powered search query:", query)

    const plan = await planQuery(query.trim())
    console.log("📋 Query plan:", {
      intent: plan.intent,
      confidence: plan.confidence,
      apiCallsCount: plan.apiCalls?.length || 0,
    })

    if (!plan || plan.confidence < 0.3) {
      return NextResponse.json({
        success: true,
        data: {
          type: plan?.intent || "unknown_query",
          query: query,
          commentary: plan?.hunterCommentary || "The Hunter cannot decipher this request...",
          results: [],
          error: "LOW_CONFIDENCE",
          message: "Try being more specific.",
          aiReasoning: plan?.reasoning || "Planning failed",
        },
      })
    }

    const apiKey = process.env.ALCHEMY_API_KEY || "HvFT9CDpoh__KWYWI2_i2jUyRc5Aqtcv"
    const apiResults: any = {}

    if (plan.apiCalls && plan.apiCalls.length > 0) {
      for (const apiCall of plan.apiCalls) {
        const result = await executeApiCall(apiCall.method, apiCall.params, apiKey)
        apiResults[apiCall.purpose] = result
      }
    }

    const processedResults = []

    if (plan.intent === "address_analysis" && plan.extractedData?.addresses) {
      for (const address of plan.extractedData.addresses) {
        const result = await processAddressAnalysis(address, apiResults, apiKey)
        if (result) processedResults.push(result)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        type: plan.intent,
        query: query,
        commentary: plan.hunterCommentary,
        results: processedResults,
        aiReasoning: plan.reasoning,
        confidence: plan.confidence,
      },
    })
  } catch (error) {
    console.error("❌ AI-powered search failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Search failed",
        message: error instanceof Error ? error.message : "The Hunter's AI has encountered an error.",
      },
      { status: 500 },
    )
  }
}
