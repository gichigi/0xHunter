import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { alchemy } from "@/utils/alchemy"
import { createQueryPlan } from "@/lib/ai-agent"
import { validateQuery } from "@/utils/validation"
import { getTokenPriceByAddress } from "@/utils/coingecko"
import { readFileSync } from "fs"
import { join } from "path"
import { isMethodAllowed } from "@/utils/alchemy-allowlist"
import { getCollectionNameByAddress } from "@/utils/nft-resolver"

// Direct RPC fallback for SDK failures in Next.js server environment
async function directRpcCall(method: string, params: any[], retries = 2): Promise<any> {
  const apiKey = process.env.ALCHEMY_API_KEY
  if (!apiKey) throw new Error("ALCHEMY_API_KEY not configured")

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
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
        const errorText = await response.text()
        console.error(`❌ RPC call failed (${response.status}):`, errorText)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))) // Exponential backoff
          continue
        }
        throw new Error(`RPC call failed: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.error) {
        console.error(`❌ RPC error:`, data.error)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
          continue
        }
        throw new Error(`RPC error: ${data.error.message}`)
      }

      console.log(`✅ RPC ${method} returned:`, data.result ? (typeof data.result === 'string' ? data.result.slice(0, 50) : 'object') : 'null')
      return data.result
    } catch (error: any) {
      if (attempt < retries) {
        console.warn(`⚠️ RPC call attempt ${attempt + 1} failed, retrying...`, error.message)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }
      console.error(`❌ directRpcCall(${method}) failed after ${retries + 1} attempts:`, error.message)
      throw error
    }
  }
  
  throw new Error(`RPC call failed after ${retries + 1} attempts`)
}

// Map old method names to new Alchemy SDK paths for backward compatibility
const METHOD_PATH_MAP: Record<string, string> = {
  eth_getBalance: "core.getBalance",
  eth_getTransactionCount: "core.getTransactionCount",
  alchemy_getTokenBalances: "core.getTokenBalances",
  alchemy_getTokenMetadata: "core.getTokenMetadata",
  alchemy_getAssetTransfers: "core.getAssetTransfers",
  alchemy_getNFTs: "nft.getNftsForOwner",
  eth_getLogs: "core.getLogs",
}

/**
 * Execute a generic Alchemy SDK method call
 * Validates method path against allowlist before execution
 */
async function executeAlchemyCall(methodPath: string, params: any[]): Promise<any> {
  // Validate method is in allowlist
  if (!isMethodAllowed(methodPath)) {
    console.error(`❌ Method not in allowlist: ${methodPath}`)
    return null
  }

  try {
    console.log(`🔗 Executing alchemy_call(${methodPath}) with params:`, params)

    // Parse method path (e.g., "core.getBalance" -> alchemy.core.getBalance)
    const [namespace, methodName] = methodPath.split(".")
    if (!namespace || !methodName) {
      console.error(`❌ Invalid method path format: ${methodPath}`)
      return null
    }

    // Get the namespace object (alchemy.core or alchemy.nft)
    const namespaceObj = (alchemy as any)[namespace]
    if (!namespaceObj || typeof namespaceObj[methodName] !== "function") {
      console.error(`❌ Method not found: ${methodPath}`)
      return null
    }

    // Handle special cases for different method types
    let result: any = null

    if (methodPath === "nft.getNftsForOwner") {
      // NFT method: handle both formats
      // Format 1: [ownerAddress, options]
      // Format 2: [ownerAddress] (default options)
      const owner = params[0]
      let options = params[1] || { omitMetadata: false }
      
      // If options is a string or undefined, convert to object
      if (typeof options !== 'object' || options === null) {
        options = { omitMetadata: false }
      }
      
      result = await namespaceObj[methodName](owner, options)
    } else if (methodPath === "core.getBalance" || methodPath === "core.getTransactionCount") {
      // Balance/TxCount: Use direct RPC to avoid Next.js fetch/ethers provider issues
      // Map to RPC method names
      const rpcMethod = methodPath === "core.getBalance" ? "eth_getBalance" : "eth_getTransactionCount"
      // Ensure params are in correct format: [address, blockTag]
      const rpcParams = Array.isArray(params) && params.length > 0 
        ? [params[0], params[1] || "latest"]
        : params
      try {
        console.log(`🔎 RPC ${rpcMethod} params:`, JSON.stringify(rpcParams))
        result = await directRpcCall(rpcMethod, rpcParams)
        console.log(`✅ ${methodPath} RPC call succeeded, result:`, result ? (typeof result === 'string' ? result.slice(0, 50) : 'object') : 'null')
      } catch (error: any) {
        console.error(`❌ ${methodPath} RPC call failed:`, error.message)
        result = null
      }
    } else if (methodPath === "core.getTokenBalances") {
      // TokenBalances: Try SDK method first (it doesn't use provider, should work)
      // If that fails, fallback to direct RPC
      try {
        const address = params[0]
        const tokenType = params[1] || undefined
        // SDK method signature: getTokenBalances(address, tokenType?)
        result = tokenType 
          ? await namespaceObj[methodName](address, tokenType)
          : await namespaceObj[methodName](address)
      } catch (sdkError) {
        // Fallback to direct RPC if SDK fails
        console.warn(`⚠️ SDK getTokenBalances failed, trying RPC:`, sdkError)
        const address = params[0]
        const rpcParams = params[1] !== undefined ? [address, params[1]] : [address]
        const rpcResult = await directRpcCall("alchemy_getTokenBalances", rpcParams)
        if (rpcResult && typeof rpcResult === 'object' && 'tokenBalances' in rpcResult) {
          result = rpcResult
        } else {
          console.warn(`⚠️ RPC getTokenBalances also failed or returned unexpected format`)
          result = { tokenBalances: [] }
        }
      }
    } else if (methodPath === "core.getTokenMetadata") {
      // TokenMetadata: Use direct RPC to avoid Next.js fetch/ethers provider issues
      const contractAddress = params[0]
      try {
        result = await directRpcCall("alchemy_getTokenMetadata", [contractAddress])
        console.log(`✅ ${methodPath} RPC call succeeded`)
      } catch (error: any) {
        console.error(`❌ ${methodPath} RPC call failed:`, error.message)
        result = null
      }
    } else {
      // All other methods: call with params as-is
      result = await namespaceObj[methodName](...params)
    }

    console.log(`✅ alchemy_call(${methodPath}) successful`)
    return result
  } catch (error: any) {
    console.error(`❌ alchemy_call(${methodPath}) failed:`, error)
    return null
  }
}

async function executeApiCall(method: string, params: any[]) {
  try {
    console.log(`🔗 Executing ${method} with params:`, params)

    // Handle new generic alchemy_call format
    if (method === "alchemy_call") {
      const methodPath = params[0]
      const callParams = params[1] || []
      return await executeAlchemyCall(methodPath, callParams)
    }

    // Handle old method names - map to new paths for backward compatibility
    const methodPath = METHOD_PATH_MAP[method]
    if (methodPath) {
      // Convert params for new format
      let convertedParams = params
      
      // Special handling for old method formats
      if (method === "eth_getBalance" || method === "eth_getTransactionCount") {
        convertedParams = [params[0], params[1] || "latest"]
      } else if (method === "alchemy_getNFTs") {
        // Old format: params[0] is object {owner, withMetadata}
        // New format: first param is owner address, second is options
        const owner = params[0]?.owner || params[0]
        const options = { omitMetadata: !(params[0]?.withMetadata ?? true) }
        convertedParams = [owner, options]
      } else if (method === "alchemy_getAssetTransfers" || method === "eth_getLogs") {
        convertedParams = [params[0]]
      } else if (method === "alchemy_getTokenBalances" || method === "alchemy_getTokenMetadata") {
        convertedParams = [params[0]]
      }
      
      return await executeAlchemyCall(methodPath, convertedParams)
    }

    // Fallback: try as direct method path (for new format)
    if (method.includes(".")) {
      return await executeAlchemyCall(method, params)
    }

    // Unknown method
    console.error(`❌ Unknown method: ${method}`)
    return null
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

async function processAddressAnalysis(address: string, apiResults: any, extractedData?: any) {
  try {
    console.log(`🔍 Processing address analysis for ${address}`)

    const result: any = {
      address,
      shortAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
    }

    // Extract balance if it was fetched (even if null, show 0)
    if (apiResults.balance !== undefined) {
      const balance = apiResults.balance
      if (balance) {
        const balanceWei = hexToBigInt(balance)
        const balanceEth = weiToEth(balanceWei)
        result.balance = `${balanceEth.toFixed(4)} ETH`
      } else {
        result.balance = "0.0000 ETH"
      }
    }

    // Extract transaction count if it was fetched (even if null, show 0)
    if (apiResults.transactionCount !== undefined) {
      const txCount = apiResults.transactionCount
      if (txCount) {
        const txCountNum = Number(hexToBigInt(txCount))
        result.transactions = txCountNum
      } else {
        result.transactions = 0
      }
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
        
        // If a specific NFT collection was asked about, filter by it
        const requestedCollection = extractedData?.nftCollections?.[0]
        let filteredNfts = ownedNfts
        
        if (requestedCollection) {
          console.log(`🔍 Filtering NFTs for collection: ${requestedCollection}`)
          console.log(`🔍 Total NFTs before filter: ${ownedNfts.length}`)
          // Filter NFTs by the requested collection address (case-insensitive)
          filteredNfts = ownedNfts.filter((nft: any) => {
            const nftAddress = nft.contract?.address?.toLowerCase()
            const matches = nftAddress === requestedCollection.toLowerCase()
            if (matches) {
              console.log(`✅ Found matching NFT: ${nftAddress} === ${requestedCollection.toLowerCase()}`)
            }
            return matches
          })
          console.log(`🔍 NFTs after filter: ${filteredNfts.length}`)
          
          // Add flag indicating if the requested collection was found
          result.requestedCollectionFound = filteredNfts.length > 0
          result.requestedCollectionAddress = requestedCollection
        }
        
        result.nfts = {
          totalCount: nftsData.totalCount || ownedNfts.length,
          requestedCollectionCount: requestedCollection ? filteredNfts.length : undefined,
          ownedNfts: filteredNfts.slice(0, 20).map((nft: any) => ({
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
        // If a collection was requested but no NFTs found, mark as not found
        if (extractedData?.nftCollections?.[0]) {
          result.requestedCollectionFound = false
          result.requestedCollectionAddress = extractedData.nftCollections[0]
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
  let query = ""
  try {
    const body = await request.json()
    query = body.query || ""

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
          message: validation.error || "0xHunter cannot track this target...",
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
      apiCalls: plan.apiCalls,
      extractedData: plan.extractedData,
      reasoning: plan.reasoning,
    })

    if (!plan || plan.confidence < 0.3 || plan.intent === "unknown") {
      return NextResponse.json({
        success: true,
        data: {
          type: "unknown_query",
          query: query,
          response: "The mists are too thick. 0xHunter needs a clearer trail—try an address, token symbol, or NFT collection.",
          results: [],
          confidence: plan?.confidence || 0,
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
              // Preserve arrays (for alchemy_call format: [methodPath, [actualParams]])
              if (Array.isArray(param)) {
                return param.map((p: any) => {
                  if (typeof p === 'string' && p.startsWith('0x') && p.length === 42) {
                    return address
                  }
                  return p
                })
              }
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
                // For NFT calls, always set owner to current address
                if (apiCall.method === 'alchemy_getNFTs') {
                  newParam.owner = address
                }
                // Replace address fields if they match any of the extracted addresses
                else if (newParam.owner && plan.extractedData?.addresses?.includes(newParam.owner)) {
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
            
            // Special handling: If NFT collection query, add contractAddresses filter to API call
            // This filters at the API level, avoiding pagination issues
            let finalParams = params
            if (plan.extractedData?.nftCollections?.[0]) {
              const collectionAddress = plan.extractedData.nftCollections[0]
              const isNftMethod = apiCall.method === 'nft.getNftsForOwner' || 
                                 (apiCall.method === 'alchemy_call' && params[0] === 'nft.getNftsForOwner')
              
              if (isNftMethod) {
                if (apiCall.method === 'alchemy_call') {
                  // Format: [methodPath, [owner]] or [methodPath, [owner, options]]
                  const methodPath = params[0]
                  const actualParams = params[1] || []
                  const owner = actualParams[0] || address
                  const existingOptions = actualParams[1] || {}
                  finalParams = [methodPath, [owner, { ...existingOptions, contractAddresses: [collectionAddress] }]]
                } else {
                  // Direct method: [owner] or [owner, options]
                  const owner = params[0] || address
                  const existingOptions = params[1] || {}
                  finalParams = [owner, { ...existingOptions, contractAddresses: [collectionAddress] }]
                }
                console.log(`🎯 Filtering NFTs by collection: ${collectionAddress}`)
              }
            }
            
            const result = await executeApiCall(apiCall.method, finalParams)
            // Always use method-based keys (not purpose keys) to match processAddressAnalysis expectations
            // Handle both old method names and new method paths
            const resultKey = (() => {
              // Check if it's the new generic format
              if (apiCall.method === 'alchemy_call') {
                const methodPath = params[0] || ''
                if (methodPath === 'core.getBalance') return 'balance'
                if (methodPath === 'core.getTransactionCount') return 'transactionCount'
                if (methodPath === 'core.getTokenBalances') return 'tokenBalances'
                if (methodPath === 'nft.getNftsForOwner') return 'nfts'
                if (methodPath === 'core.getAssetTransfers') return 'transfers'
                // Extract method name from path for other methods
                return methodPath.split('.').pop() || methodPath
              }
              // Direct method paths (new format without alchemy_call wrapper)
              if (apiCall.method === 'core.getBalance') return 'balance'
              if (apiCall.method === 'core.getTransactionCount') return 'transactionCount'
              if (apiCall.method === 'core.getTokenBalances') return 'tokenBalances'
              if (apiCall.method === 'nft.getNftsForOwner') return 'nfts'
              if (apiCall.method === 'core.getAssetTransfers') return 'transfers'
              // Old method names
              if (apiCall.method === 'eth_getBalance') return 'balance'
              if (apiCall.method === 'eth_getTransactionCount') return 'transactionCount'
              if (apiCall.method === 'alchemy_getTokenBalances') return 'tokenBalances'
              if (apiCall.method === 'alchemy_getNFTs') return 'nfts'
              if (apiCall.method === 'alchemy_getAssetTransfers') return 'transfers'
              // If method is already a path (new format), extract method name
              if (apiCall.method.includes('.')) {
                return apiCall.method.split('.').pop() || apiCall.method
              }
              return apiCall.method
            })()
            console.log(`📦 Storing result for ${apiCall.method} with key: ${resultKey}`, result ? 'has data' : 'null')
            // Store result even if null (processAddressAnalysis will handle it)
            addressApiResults[resultKey] = result
          }
          
          console.log(`🔍 Processing address analysis with apiResults keys:`, Object.keys(addressApiResults))
          console.log(`🔍 API results values:`, Object.entries(addressApiResults).map(([k, v]) => [k, v ? (typeof v === 'string' ? v.slice(0, 50) : 'object') : 'null']))
          const result = await processAddressAnalysis(address, addressApiResults, plan.extractedData)
          console.log(`✅ Processed result keys:`, result ? Object.keys(result) : 'null')
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
        if (plan.intent === "token_analysis") {
          processedResults.push(apiResults)
        }
      }
    }

    // Post-processing: Fetch token prices if needed
    if (plan.intent === "token_analysis" && plan.extractedData?.contractAddresses) {
      const queryLower = query.toLowerCase()
      const needsPrice = queryLower.includes("price") || queryLower.includes("cost") || queryLower.includes("worth")
      
      if (needsPrice) {
        // Fetch prices for all extracted token addresses
        const pricePromises = plan.extractedData.contractAddresses.map(async (address: string) => {
          const price = await getTokenPriceByAddress(address)
          return { address, price }
        })
        
        const prices = await Promise.all(pricePromises)
        const priceMap = new Map(prices.filter(p => p.price !== null).map(p => [p.address.toLowerCase(), p.price]))
        
        // Add prices to processedResults
        if (processedResults.length > 0 && processedResults[0]) {
          if (!processedResults[0].tokenPrices) {
            processedResults[0].tokenPrices = {}
          }
          priceMap.forEach((price, address) => {
            processedResults[0].tokenPrices[address] = price
          })
        } else {
          // Create new result object if none exists
          processedResults.push({
            tokenPrices: Object.fromEntries(priceMap),
            contractAddresses: plan.extractedData.contractAddresses,
          })
        }
      }
    }

    // Generate AI text response from the results
    let responseText = ""
    
    // Handle empty results
    if (processedResults.length === 0) {
      responseText = "The shadows reveal nothing."
    } else {
      // Special handling for NFT collection queries
      const firstResult = processedResults[0]
      if (firstResult?.requestedCollectionFound !== undefined) {
        // Answer the specific NFT collection question
        const collectionAddress = firstResult.requestedCollectionAddress
        const collectionName = collectionAddress ? getCollectionNameByAddress(collectionAddress) : null
        const displayName = collectionName || "this collection"
        
        if (firstResult.requestedCollectionFound) {
          const count = firstResult.nfts?.requestedCollectionCount || 0
          responseText = `The den holds **${count}** ${displayName} NFT${count !== 1 ? 's' : ''} in the shadows.`
        } else {
          responseText = `No ${displayName} found. The shadows reveal nothing.`
        }
      } else {
        try {
          // Read brand voice guidelines
          const brandVoicePath = join(process.cwd(), "BRAND_VOICE.md")
          const brandVoice = readFileSync(brandVoicePath, "utf-8")

          const { text } = await generateText({
            model: openai("gpt-4o-mini"),
            prompt: `You are 0xHunter. User asked: "${query}"

Results: ${JSON.stringify(processedResults, null, 2)}

${brandVoice}

Rules:
- EXACTLY 1 sentence, 8-15 words maximum
- Use dark forest metaphors: "trail," "shadows," "den," "whispers," "echoes"
- Never use plain statements like "Balance: X ETH" - weave it into the narrative
- Mention ONLY the most important number (balance OR token count OR NFT count, not all)
- If results exist, show ONE key fact. If empty, say "The shadows reveal nothing."
- Use markdown: **bold** for numbers, monospace \`code\` for addresses
- Examples (GOOD):
  * "The den holds **3.76 ETH** in shadow pools."
  * "**27,603 NFTs** lurk in this wallet's depths."
  * "UNI whispers at **$7.49** in the dark forest."
  * "The shadows reveal nothing."
- Examples (BAD - never use):
  * "Balance: **3.76 ETH**."
  * "The balance is **3.76 ETH**."
  * "This address has **3.76 ETH**."
- Don't use multiple bold tags - use one **bold** per response
- Be mysterious, not friendly or explanatory`,
          })
          responseText = text
        } catch (error) {
          console.error("❌ AI response generation failed:", error)
          // Generate simple fallback based on results
          if (processedResults.length === 0) {
            responseText = "The shadows reveal nothing."
          } else {
            responseText = "0xHunter has tracked the target."
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        type: plan.intent,
        query: query,
        response: responseText,
        results: processedResults,
        confidence: plan.confidence,
      },
    })
  } catch (error) {
    console.error("❌ AI-powered search failed:", error)

    return NextResponse.json(
      {
        success: true,
        data: {
          type: "error",
          query: query,
          response: "The trail grows cold. 0xHunter cannot track this target.",
          results: [],
          confidence: 0,
        },
      },
      { status: 200 }, // Return 200 so UI can display gracefully
    )
  }
}
