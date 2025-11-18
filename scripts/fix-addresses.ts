/**
 * Script to find correct token addresses using CoinGecko
 * Then verify them with Alchemy
 */

import { config } from "dotenv"
import { fileURLToPath } from "url"
import { dirname, resolve } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local
config({ path: resolve(__dirname, "../.env.local") })

import { alchemy } from "../utils/alchemy"
import { searchToken } from "../utils/coingecko"

interface TokenToFix {
  symbol: string
  currentAddress: string
  reason: string
}

const tokensToFix: TokenToFix[] = [
  { symbol: "DOGE", currentAddress: "0xba2ae424d960c26247dd6c32edc70b295c744C43", reason: "DOGE is native to Dogecoin, not Ethereum" },
  { symbol: "OP", currentAddress: "0x4200000000000000000000000000000000000042", reason: "Optimism token may not be on mainnet" },
  { symbol: "RNDR", currentAddress: "0x6De037ef9aD2725F4015C7F7F3b4B5F3F3b5F3F3", reason: "Address looks suspicious - try RNDR instead" },
]

async function findAndVerifyToken(symbol: string, alternativeSymbols?: string[]) {
  console.log(`\n🔍 Searching for ${symbol}...`)
  
  // Try main symbol first
  let coinGeckoResult = await searchToken(symbol)
  
  // Try alternatives if main search fails
  if ((!coinGeckoResult || !coinGeckoResult.contractAddress) && alternativeSymbols) {
    for (const alt of alternativeSymbols) {
      console.log(`  🔄 Trying alternative: ${alt}`)
      coinGeckoResult = await searchToken(alt)
      if (coinGeckoResult && coinGeckoResult.contractAddress) {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  // Try direct CoinGecko API call to see what we get
  if (!coinGeckoResult || !coinGeckoResult.contractAddress) {
    console.log(`  🔍 Trying direct CoinGecko API call...`)
    try {
      const apiKey = process.env.COINGECKO_API_KEY
      const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (apiKey) {
        headers["x-cg-demo-api-key"] = apiKey
      }
      const response = await fetch(url, { headers })
      const data = await response.json()
      console.log(`  📊 CoinGecko returned ${data.coins?.length || 0} results`)
      if (data.coins && data.coins.length > 0) {
        console.log(`  Top 3 matches:`)
        for (const coin of data.coins.slice(0, 3)) {
          console.log(`    - ${coin.name} (${coin.symbol}) - ID: ${coin.id}`)
          // Try to get details to check for Ethereum contract
          try {
            const { getTokenDetails } = await import("../utils/coingecko")
            const details = await getTokenDetails(coin.id)
            if (details?.contractAddress) {
              console.log(`      ✅ Has Ethereum contract: ${details.contractAddress}`)
              // Verify with Alchemy
              try {
                const metadata = await alchemy.core.getTokenMetadata(details.contractAddress)
                if (metadata.symbol?.toUpperCase() === symbol.toUpperCase()) {
                  console.log(`      ✅ Verified with Alchemy: ${metadata.name} (${metadata.symbol})`)
                  return {
                    symbol: symbol,
                    address: details.contractAddress,
                    name: coin.name,
                    decimals: metadata.decimals || 18,
                    verified: true,
                  }
                }
              } catch (alchemyError: any) {
                console.log(`      ⚠️  Alchemy verification failed: ${alchemyError.message}`)
              }
            } else {
              console.log(`      ❌ No Ethereum contract found`)
            }
          } catch (error: any) {
            console.log(`      ⚠️  Could not get details: ${error.message}`)
          }
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }
    } catch (error: any) {
      console.log(`  ⚠️  Direct API call failed: ${error.message}`)
    }
    console.log(`  ❌ Not found on CoinGecko or no Ethereum contract`)
    return null
  }

  console.log(`  📍 Found on CoinGecko: ${coinGeckoResult.contractAddress}`)
  console.log(`     Name: ${coinGeckoResult.name}`)
  console.log(`     Symbol: ${coinGeckoResult.symbol}`)

  // Verify with Alchemy
  try {
    const metadata = await alchemy.core.getTokenMetadata(coinGeckoResult.contractAddress)
    console.log(`  ✅ Verified with Alchemy:`)
    console.log(`     Name: ${metadata.name}`)
    console.log(`     Symbol: ${metadata.symbol}`)
    console.log(`     Decimals: ${metadata.decimals}`)

    if (metadata.symbol?.toUpperCase() === symbol.toUpperCase()) {
      return {
        symbol: symbol,
        address: coinGeckoResult.contractAddress,
        name: coinGeckoResult.name,
        decimals: metadata.decimals || 18,
        verified: true,
      }
    } else {
      console.log(`  ⚠️  Symbol mismatch: expected ${symbol}, got ${metadata.symbol}`)
      return null
    }
  } catch (error: any) {
    console.log(`  ❌ Alchemy verification failed: ${error.message}`)
    return null
  }
}

async function main() {
  console.log("🔧 Finding correct token addresses using CoinGecko + Alchemy verification\n")

  const results: Array<{
    symbol: string
    address: string
    name: string
    decimals: number
  }> = []

  for (const token of tokensToFix) {
    const alternatives = token.symbol === "RNDR" ? ["Render Token", "render-network"] : undefined
    const result = await findAndVerifyToken(token.symbol, alternatives)
    if (result) {
      results.push(result)
    }
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  if (results.length > 0) {
    console.log("\n✅ Found correct addresses:")
    console.log("\nUpdate config/tokens.json with:")
    console.log(JSON.stringify(
      results.reduce((acc, token) => {
        acc[token.symbol] = {
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          decimals: token.decimals,
        }
        return acc
      }, {} as Record<string, any>),
      null,
      2
    ))
  } else {
    console.log("\n❌ No valid addresses found. These tokens may not exist on Ethereum mainnet.")
  }
}

main().catch((error) => {
  console.error("❌ Script failed:", error)
  process.exit(1)
})

