/**
 * Token symbol resolution utility
 * Resolves token symbols to contract addresses with fallback chain
 * 
 * Fallback order:
 * 1. Static config (fast, no API calls)
 * 2. In-memory cache (recent lookups)
 * 3. CoinGecko API (external lookup)
 * 4. Cache result for future queries
 */

import { searchToken } from "./coingecko"
import tokensConfigData from "@/config/tokens.json"

const tokensConfig = tokensConfigData as {
  tokens: Record<string, { symbol: string; name: string; address: string; decimals: number }>
}

// In-memory cache for symbol → address lookups
const tokenCache = new Map<string, { address: string; timestamp: number }>()

// Cache TTL: 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000

interface TokenInfo {
  symbol: string
  name: string
  address: string
  decimals?: number
}

/**
 * Resolve token symbol to contract address
 * Uses fallback chain: static config → cache → CoinGecko API
 */
export async function resolveTokenSymbol(symbol: string): Promise<TokenInfo | null> {
  const normalizedSymbol = symbol.toUpperCase().trim()

  // 1. Check static config first (fastest, no API calls)
  const staticToken = normalizedSymbol in tokensConfig.tokens 
    ? tokensConfig.tokens[normalizedSymbol]
    : null
  if (staticToken) {
    return {
      symbol: staticToken.symbol,
      name: staticToken.name,
      address: staticToken.address,
      decimals: staticToken.decimals,
    }
  }

  // 2. Check in-memory cache
  const cached = tokenCache.get(normalizedSymbol)
  if (cached) {
    const age = Date.now() - cached.timestamp
    if (age < CACHE_TTL) {
      // Cache hit - get full info from static config if available, or return cached address
      return {
        symbol: normalizedSymbol,
        name: normalizedSymbol, // Fallback name
        address: cached.address,
      }
    } else {
      // Cache expired, remove it
      tokenCache.delete(normalizedSymbol)
    }
  }

  // 3. Query CoinGecko API
  try {
    const coinGeckoResult = await searchToken(normalizedSymbol)
    if (coinGeckoResult && coinGeckoResult.contractAddress) {
      // Cache the result
      tokenCache.set(normalizedSymbol, {
        address: coinGeckoResult.contractAddress,
        timestamp: Date.now(),
      })

      return {
        symbol: coinGeckoResult.symbol,
        name: coinGeckoResult.name,
        address: coinGeckoResult.contractAddress,
      }
    }
  } catch (error) {
    console.error(`CoinGecko lookup failed for ${normalizedSymbol}:`, error)
  }

  // 4. All lookups failed
  return null
}

/**
 * Resolve multiple token symbols in parallel
 */
export async function resolveTokenSymbols(symbols: string[]): Promise<Map<string, TokenInfo>> {
  const results = new Map<string, TokenInfo>()

  // Resolve all symbols in parallel
  const promises = symbols.map(async (symbol) => {
    const resolved = await resolveTokenSymbol(symbol)
    if (resolved) {
      results.set(symbol.toUpperCase(), resolved)
    }
  })

  await Promise.all(promises)
  return results
}

/**
 * Get all tokens from static config
 */
export function getStaticTokens(): Record<string, TokenInfo> {
  const result: Record<string, TokenInfo> = {}
  for (const [symbol, token] of Object.entries(tokensConfig.tokens)) {
    result[symbol] = {
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      decimals: token.decimals,
    }
  }
  return result
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now()
  for (const [symbol, cached] of tokenCache.entries()) {
    if (now - cached.timestamp >= CACHE_TTL) {
      tokenCache.delete(symbol)
    }
  }
}

