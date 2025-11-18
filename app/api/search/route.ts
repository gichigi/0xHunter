import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { alchemy } from "@/utils/alchemy"
import { createQueryPlan } from "@/lib/ai-agent"
import { validateQuery } from "@/utils/validation"

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

async function processAddressAnalysis(address: string, apiResults: any) {
  try {
    console.log(`🔍 Processing address analysis for ${address}`)

    const result: any = {
      address,
      shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
    }

    // Extract balance if it was fetched
    if (apiResults.balance !== undefined) {
      const balance = apiResults.balance
      const balanceWei = balance ? hexToBigInt(balance) : BigInt(0)
      const balanceEth = weiToEth(balanceWei)
      result.balance = `${balanceEth.toFixed(4)} ETH`
    }

    // Extract transaction count if it was fetched
    if (apiResults.transactionCount !== undefined) {
      const txCount = apiResults.transactionCount
      const txCountNum = txCount ? Number(hexToBigInt(txCount)) : 0
      result.transactions = txCountNum
    }

    // Extract token balances if they were fetched
    if (apiResults.tokenBalances !== undefined) {
      const tokenBalances = apiResults.tokenBalances?.tokenBalances || []
      const significantTokens = tokenBalances.filter((token: any) => {
        try {
          const bal = hexToBigInt(token.tokenBalance)
          return bal > BigInt(0)
        } catch {
          return false
        }
      })

      // Check if we need metadata (if alchemy_getTokenMetadata was called for any token)
      // For now, always fetch metadata for tokens if tokenBalances exist
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

    // Extract NFTs if they were fetched
    if (apiResults.nfts !== undefined) {
      const nftsData = apiResults.nfts
      if (nftsData) {
        const ownedNfts = nftsData.ownedNfts || []
        result.nfts = {
          totalCount: nftsData.totalCount || ownedNfts.length,
          ownedNfts: ownedNfts.slice(0, 20).map((nft: any) => ({
            contractAddress: nft.contract?.address,
            tokenId: nft.tokenId,
            name: nft.name || nft.title || "Unnamed NFT",
            collectionName: nft.contract?.name || "Unknown Collection",
            tokenType: nft.tokenType || "UNKNOWN",
          })),
        }
      } else {
        result.nfts = {
          totalCount: 0,
          ownedNfts: [],
        }
      }
    }

    // Extract transfers if they were fetched
    if (apiResults.transfers !== undefined) {
      result.transfers = apiResults.transfers
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

    // Server-side validation as safety net
    const validation = validateQuery(query.trim())
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false,
          error: "VALIDATION_ERROR",
          message: validation.error || "The Hunter cannot track this target...",
        },
        { status: 400 }
      )
    }

    console.log("🔍 AI-powered search query:", query)

    const plan = await createQueryPlan(query.trim())
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
        },
      })
    }

    const processedResults = []

    // Execute API calls from plan directly
    if (plan.apiCalls && plan.apiCalls.length > 0) {
      const apiResults: any = {}
      
      // Group API calls by address if this is an address_analysis query
      if (plan.intent === "address_analysis" && plan.extractedData?.addresses) {
        // For address analysis, execute calls per address
        for (const address of plan.extractedData.addresses) {
          const addressApiResults: any = {}
          
          // Execute each API call, using the address from the loop
          for (const apiCall of plan.apiCalls) {
            // Replace address in params - AI should use actual addresses, but handle edge cases
            const params = apiCall.params.map((param: any) => {
              if (typeof param === 'string') {
                // If param is an address (starts with 0x and is 42 chars), use current address
                if (param.startsWith('0x') && param.length === 42) {
                  return address
                }
                // Otherwise keep as-is (like "latest")
                return param
              }
              if (typeof param === 'object' && param !== null) {
                // Handle object params (like alchemy_getNFTs, alchemy_getAssetTransfers)
                const newParam = { ...param }
                // Replace address fields if they match any of the extracted addresses
                if (newParam.owner && plan.extractedData?.addresses?.includes(newParam.owner)) {
                  newParam.owner = address
                }
                if (newParam.fromAddress && plan.extractedData?.addresses?.includes(newParam.fromAddress)) {
                  newParam.fromAddress = address
                }
                if (newParam.toAddress && plan.extractedData?.addresses?.includes(newParam.toAddress)) {
                  newParam.toAddress = address
                }
                return newParam
              }
              return param
            })
            
            const result = await executeApiCall(apiCall.method, params)
            // Use purpose as the key, or derive from method
            const purposeKey = apiCall.purpose || 
              (apiCall.method === 'eth_getBalance' ? 'balance' :
               apiCall.method === 'eth_getTransactionCount' ? 'transactionCount' :
               apiCall.method === 'alchemy_getTokenBalances' ? 'tokenBalances' :
               apiCall.method === 'alchemy_getNFTs' ? 'nfts' :
               apiCall.method === 'alchemy_getAssetTransfers' ? 'transfers' :
               apiCall.method)
            addressApiResults[purposeKey] = result
          }
          
          const result = await processAddressAnalysis(address, addressApiResults)
          if (result) processedResults.push(result)
        }
      } else {
        // For non-address queries, execute calls directly
        for (const apiCall of plan.apiCalls) {
          const result = await executeApiCall(apiCall.method, apiCall.params)
          const purposeKey = apiCall.purpose || apiCall.method
          apiResults[purposeKey] = result
        }
        
        // Process results based on intent
        if (plan.intent === "token_analysis" || plan.intent === "transaction_history") {
          processedResults.push(apiResults)
        }
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
- Only mention fields that were actually fetched (check what's in the results)
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
