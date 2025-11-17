import { type NextRequest, NextResponse } from "next/server"
import { generateObject, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { alchemy } from "@/utils/alchemy"

// Direct RPC fallback for SDK failures in Next.js server environment
async function directRpcCall(method: string, params: any[]): Promise<any> {
  const apiKey = process.env.ALCHEMY_API_KEY
  if (!apiKey) throw new Error("ALCHEMY_API_KEY not configured")

  const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${apiKey}`, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    }),
  })

  if (!response.ok) {
    throw new Error(`RPC call failed: ${response.statusText}`)
  }

  const data = await response.json()
  if (data.error) {
    throw new Error(`RPC error: ${data.error.message}`)
  }

  return data.result
}

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
  scope: z.enum(["minimal", "standard", "full"]),
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

Scope Detection (PER-ADDRESS analysis depth):
Set scope based on query intent:
- "minimal": Simple/focused queries ("ETH balance", "balance of", "compare 10 addresses") → ONLY balance
- "standard": Basic analysis ("analyze address", "check wallet", "what tokens") → balance + txCount + tokens (NO metadata)
- "full": Deep dives ("full analysis", "everything about", "deep dive") → balance + txCount + tokens + NFTs + metadata

IMPORTANT: For comparison queries with multiple addresses, use "minimal" or "standard" scope to avoid slow/expensive calls.

API Call Planning by Scope:
- minimal: ONLY eth_getBalance for each address
- standard: eth_getBalance + eth_getTransactionCount + alchemy_getTokenBalances for each address
- full: eth_getBalance + eth_getTransactionCount + alchemy_getTokenBalances + alchemy_getNFTs for each address

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
        scope: "standard" as const,
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
        scope: "minimal" as const,
        extractedData: { tokens: [tokenMatch[1]] },
        apiCalls: [],
        reasoning: "Fallback token detection",
        hunterCommentary: `The ${tokenMatch[1]} token calls from the shadows, but the path remains unclear...`,
      }
    }

    return {
      intent: "unknown" as const,
      confidence: 0,
      scope: "minimal" as const,
      extractedData: {},
      apiCalls: [],
      reasoning: "No fallback pattern matched",
      hunterCommentary: "The digital mists are too thick. Even The Hunter cannot pierce this veil...",
    }
  }
}

async function executeApiCall(method: string, params: any[]) {
  try {
    console.log(`🔗 Executing ${method} with params:`, params)

    let result: any = null

    try {
      switch (method) {
        case "eth_getBalance":
          result = await alchemy.core.getBalance(params[0], params[1] || "latest")
          // Convert BigNumber to hex string for consistency with existing code
          result = result.toHexString()
          break

        case "eth_getTransactionCount":
          result = await alchemy.core.getTransactionCount(params[0], params[1] || "latest")
          // Convert BigNumber to hex string for consistency with existing code
          result = result.toHexString()
          break

        case "alchemy_getTokenBalances":
          result = await alchemy.core.getTokenBalances(params[0])
          break

        case "alchemy_getTokenMetadata":
          result = await alchemy.core.getTokenMetadata(params[0])
          break

        case "alchemy_getAssetTransfers":
          result = await alchemy.core.getAssetTransfers(params[0])
          break

        case "alchemy_getNFTs":
          result = await alchemy.nft.getNftsForOwner(params[0]?.owner || params[0], {
            omitMetadata: !(params[0]?.withMetadata ?? true),
          })
          break

        case "eth_getLogs":
          result = await alchemy.core.getLogs(params[0])
          break

        default:
          console.error(`❌ Unknown method: ${method}`)
          return null
      }

      console.log(`✅ ${method} successful (SDK)`)
      return result
    } catch (sdkError: any) {
      // Fallback to direct RPC for methods that support it
      if (
        sdkError?.reason === "missing response" ||
        sdkError?.code === "SERVER_ERROR" ||
        sdkError?.message?.includes("missing response")
      ) {
        console.log(`⚠️ SDK failed for ${method}, falling back to direct RPC`)
        
        // Map SDK methods to RPC methods
        const rpcMethodMap: Record<string, string> = {
          eth_getBalance: "eth_getBalance",
          eth_getTransactionCount: "eth_getTransactionCount",
          alchemy_getTokenBalances: "alchemy_getTokenBalances",
          alchemy_getTokenMetadata: "alchemy_getTokenMetadata",
          eth_getLogs: "eth_getLogs",
        }

        const rpcMethod = rpcMethodMap[method]
        if (rpcMethod) {
          result = await directRpcCall(rpcMethod, params)
          console.log(`✅ ${method} successful (direct RPC fallback)`)
          return result
        }
      }
      throw sdkError // Re-throw if not a recoverable error
    }
  } catch (error) {
    console.error(`❌ API call ${method} failed:`, error)
    return null
  }
}

// Helper function to convert hex string to BigInt safely
function hexToBigInt(hex: string): bigint {
  if (!hex || typeof hex !== 'string') return BigInt(0)
  // BigInt constructor accepts hex strings with or without '0x' prefix
  try {
    return hex.startsWith('0x') ? BigInt(hex) : BigInt('0x' + hex)
  } catch {
    return BigInt(0)
  }
}

// Helper function to convert wei to ETH with proper precision
function weiToEth(wei: bigint | string): number {
  const weiBigInt = typeof wei === 'string' ? hexToBigInt(wei) : wei
  const ethDivisor = BigInt('1000000000000000000') // 10^18
  const ethBigInt = weiBigInt / ethDivisor
  const remainderBigInt = weiBigInt % ethDivisor
  // Convert to number with decimal precision
  return Number(ethBigInt) + Number(remainderBigInt) / 1e18
}

async function processAddressAnalysis(address: string, scope: string, apiResults: any) {
  try {
    console.log(`🔍 Processing address analysis for ${address} with scope: ${scope}`)

    // Always fetch balance
    const balance = apiResults.balance
    const balanceWei = balance ? hexToBigInt(balance) : BigInt(0)
    const balanceEth = weiToEth(balanceWei)

    const result: any = {
      address,
      shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
      balance: `${balanceEth.toFixed(4)} ETH`,
    }

    // For minimal scope, return just balance
    if (scope === "minimal") {
      return result
    }

    // For standard and full scope, add txCount
    const txCount = apiResults.transactionCount
    const txCountNum = txCount ? Number(hexToBigInt(txCount)) : 0
    result.transactions = txCountNum

    // For standard and full scope, add token balances (without metadata for standard)
    const tokenBalances = apiResults.tokenBalances?.tokenBalances || []
    const significantTokens = tokenBalances.filter((token: any) => {
      try {
        const bal = hexToBigInt(token.tokenBalance)
        return bal > BigInt(0)
      } catch {
        return false
      }
    })

    if (scope === "standard") {
      // For standard scope, include tokens but without metadata
      result.tokenHoldings = significantTokens.slice(0, 10).map((token: any) => ({
        contractAddress: token.contractAddress,
        balance: formatTokenBalance(token.tokenBalance, 18), // Default to 18 decimals without metadata
      }))
      return result
    }

    // For full scope, fetch token metadata
    if (scope === "full") {
      const tokensWithMetadata = await Promise.all(
        significantTokens.slice(0, 10).map(async (token: any) => {
          const metadata = await executeApiCall("alchemy_getTokenMetadata", [token.contractAddress])
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

      result.tokenHoldings = meaningfulTokens.map((token: any) => ({
        symbol: token.symbol,
        name: token.name,
        balance: formatTokenBalance(token.tokenBalance, token.decimals),
        contractAddress: token.contractAddress,
      }))
    }

    return result
  } catch (error) {
    console.error("❌ Address analysis processing failed:", error)
    return null
  }
}

function formatTokenBalance(balance: string, decimals = 18): string {
  try {
    const balanceWei = hexToBigInt(balance)
    // Build 10^decimals as BigInt safely (avoiding Number overflow)
    const decimalsBigInt = BigInt('1' + '0'.repeat(decimals))
    const wholePart = balanceWei / decimalsBigInt
    const remainderPart = balanceWei % decimalsBigInt
    const decimalsDivisor = Math.pow(10, decimals)
    const formatted = Number(wholePart) + Number(remainderPart) / decimalsDivisor

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
    const balanceWei = hexToBigInt(balance)
    // Build 10^decimals as BigInt safely (avoiding Number overflow)
    const decimalsBigInt = BigInt('1' + '0'.repeat(decimals))
    const wholePart = balanceWei / decimalsBigInt
    const remainderPart = balanceWei % decimalsBigInt
    const decimalsDivisor = Math.pow(10, decimals)
    return Number(wholePart) + Number(remainderPart) / decimalsDivisor
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
          results: [],
          error: "LOW_CONFIDENCE",
          message: "Try being more specific.",
          aiReasoning: plan?.reasoning || "Planning failed",
          scope: plan?.scope || "minimal",
        },
      })
    }

    const processedResults = []

    if (plan.intent === "address_analysis" && plan.extractedData?.addresses) {
      // Execute API calls per address based on scope
      for (const address of plan.extractedData.addresses) {
        const apiResults: any = {}
        
        // Generate and execute API calls for this address based on scope
        const addressApiCalls = []
        
        // minimal: only balance
        addressApiCalls.push({ method: "eth_getBalance", params: [address, "latest"], purpose: "balance" })
        
        // standard and full: add txCount and tokenBalances
        if (plan.scope === "standard" || plan.scope === "full") {
          addressApiCalls.push({ method: "eth_getTransactionCount", params: [address, "latest"], purpose: "transactionCount" })
          addressApiCalls.push({ method: "alchemy_getTokenBalances", params: [address], purpose: "tokenBalances" })
        }
        
        // full: add NFTs
        if (plan.scope === "full") {
          addressApiCalls.push({ method: "alchemy_getNFTs", params: [{ owner: address, withMetadata: true }], purpose: "nfts" })
        }
        
        // Execute API calls for this address
        for (const apiCall of addressApiCalls) {
          const result = await executeApiCall(apiCall.method, apiCall.params)
          // Normalize purpose key
          let purposeKey: string
          if (apiCall.method === 'eth_getBalance') {
            purposeKey = 'balance'
          } else if (apiCall.method === 'eth_getTransactionCount') {
            purposeKey = 'transactionCount'
          } else if (apiCall.method === 'alchemy_getTokenBalances') {
            purposeKey = 'tokenBalances'
          } else if (apiCall.method === 'alchemy_getNFTs') {
            purposeKey = 'nfts'
          } else {
            purposeKey = apiCall.purpose
          }
          apiResults[purposeKey] = result
        }
        
        const result = await processAddressAnalysis(address, plan.scope, apiResults)
        if (result) processedResults.push(result)
      }
    }

    // Generate AI text response from the results
    let responseText = ""
    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are The Hunter, a blockchain analyst. The user asked: "${query}"

Here are the blockchain results:
${JSON.stringify(processedResults, null, 2)}

Write a natural language response answering the user's query. The Hunter is a man of few but important words - be extremely concise.

Guidelines:
- Dark, mysterious tone (cryptic, ominous, tactical)
- Use markdown for formatting (bold for emphasis, lists when needed)
- Maximum 100 words for simple queries, 200 for comparisons
- Only state facts from the data - don't make assumptions about missing data
- For minimal scope: only mention balance (transactions/tokens weren't fetched)
- For standard scope: mention balance, transactions, token count (don't list contract addresses)
- Be direct and terse - every word must matter

Example tone (concise): "This wallet holds **2.0562 ETH**. **148 transactions** recorded. Active. **10 token holdings** detected."`,
      })
      responseText = text
    } catch (error) {
      console.error("❌ AI response generation failed:", error)
      responseText = "The Hunter has tracked the target, but the report remains in shadow. Check the raw results below."
    }

    return NextResponse.json({
      success: true,
      data: {
        type: plan.intent,
        query: query,
        response: responseText,
        results: processedResults,
        aiReasoning: plan.reasoning,
        confidence: plan.confidence,
        scope: plan.scope,
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
