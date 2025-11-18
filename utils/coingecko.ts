/**
 * CoinGecko API integration for token metadata
 * Used for token names, symbols, logos, and current prices
 * 
 * MVP Scope: Static metadata only (no historical prices, no charts)
 */

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3"

const apiKey = process.env.COINGECKO_API_KEY

// CoinGecko free tier allows 50 calls/minute without API key
// API key enables higher rate limits (up to 10,000 calls/month)
if (!apiKey) {
  console.warn("COINGECKO_API_KEY not set. Using free tier (50 calls/minute).")
}

interface CoinGeckoResponse<T> {
  data?: T
  error?: string
}

interface TokenMetadata {
  id: string
  symbol: string
  name: string
  image?: string
  current_price?: number
  market_cap?: number
  total_volume?: number
}

interface TokenSearchResult {
  id: string
  name: string
  symbol: string
  api_symbol?: string
  market_cap_rank?: number
  thumb?: string
  large?: string
}

/**
 * Search for a token by symbol or name
 * Returns contract address for Ethereum tokens
 */
export async function searchToken(query: string): Promise<{
  id: string
  symbol: string
  name: string
  contractAddress?: string
  image?: string
} | null> {
  try {
    const url = `${COINGECKO_API_URL}/search?query=${encodeURIComponent(query)}`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    
    if (apiKey) {
      headers["x-cg-demo-api-key"] = apiKey
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Find Ethereum token match - try exact symbol match first, then partial
    let ethereumCoin = data.coins?.find((coin: TokenSearchResult) => {
      return coin.id && coin.symbol?.toLowerCase() === query.toLowerCase()
    })

    // If no exact match, try to find any coin with matching symbol (will check platform later)
    if (!ethereumCoin) {
      ethereumCoin = data.coins?.find((coin: TokenSearchResult) => {
        return coin.symbol?.toLowerCase() === query.toLowerCase()
      })
    }

    if (!ethereumCoin) {
      return null
    }

    // Get detailed info to find contract address
    const details = await getTokenDetails(ethereumCoin.id)
    if (!details) {
      return null
    }

    return {
      id: ethereumCoin.id,
      symbol: ethereumCoin.symbol,
      name: ethereumCoin.name,
      contractAddress: details.contractAddress,
      image: ethereumCoin.large || ethereumCoin.thumb,
    }
  } catch (error) {
    console.error("CoinGecko search failed:", error)
    return null
  }
}

/**
 * Get token details by CoinGecko ID
 * Returns contract address and current price
 */
export async function getTokenDetails(coinId: string): Promise<{
  contractAddress?: string
  currentPrice?: number
  image?: string
  symbol?: string
  name?: string
} | null> {
  try {
    const url = `${COINGECKO_API_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    
    if (apiKey) {
      headers["x-cg-demo-api-key"] = apiKey
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Extract Ethereum contract address
    const ethereumPlatform = data.platforms?.ethereum
    const contractAddress = ethereumPlatform || null

    return {
      contractAddress,
      currentPrice: data.market_data?.current_price?.usd,
      image: data.image?.large || data.image?.small,
      symbol: data.symbol?.toUpperCase(),
      name: data.name,
    }
  } catch (error) {
    console.error("CoinGecko getTokenDetails failed:", error)
    return null
  }
}

/**
 * Get current price for a token by contract address
 * Returns price in USD
 */
export async function getTokenPriceByAddress(contractAddress: string): Promise<number | null> {
  try {
    const url = `${COINGECKO_API_URL}/simple/token_price/ethereum?contract_addresses=${contractAddress}&vs_currencies=usd`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    
    if (apiKey) {
      headers["x-cg-demo-api-key"] = apiKey
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    const priceData = data[contractAddress.toLowerCase()]
    
    return priceData?.usd || null
  } catch (error) {
    console.error("CoinGecko getTokenPriceByAddress failed:", error)
    return null
  }
}

/**
 * Get token metadata by contract address
 * Returns name, symbol, logo, current price
 */
export async function getTokenMetadataByAddress(contractAddress: string): Promise<{
  name: string
  symbol: string
  logo?: string
  currentPrice?: number
} | null> {
  try {
    // First get token ID from contract address
    const url = `${COINGECKO_API_URL}/coins/ethereum/contract/${contractAddress}`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    
    if (apiKey) {
      headers["x-cg-demo-api-key"] = apiKey
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      // Token might not be in CoinGecko
      return null
    }

    const data = await response.json()

    return {
      name: data.name,
      symbol: data.symbol?.toUpperCase(),
      logo: data.image?.large || data.image?.small,
      currentPrice: data.market_data?.current_price?.usd,
    }
  } catch (error) {
    console.error("CoinGecko getTokenMetadataByAddress failed:", error)
    return null
  }
}

