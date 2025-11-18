/**
 * Verification script for token and NFT collection addresses
 * Uses Alchemy API to verify that addresses match expected symbols/names
 */

// Import modules (tsx will load .env.local via --env-file flag)
import { alchemy } from "../utils/alchemy"
import tokensConfigData from "../config/tokens.json"
import collectionsConfigData from "../config/nft-collections.json"

const tokensConfig = tokensConfigData as {
  tokens: Record<string, { symbol: string; name: string; address: string; decimals: number }>
}

const collectionsConfig = collectionsConfigData as {
  collections: Record<string, { name: string; address: string; symbol?: string }>
}

interface VerificationResult {
  symbol: string
  expectedName: string
  address: string
  verified: boolean
  actualSymbol?: string
  actualName?: string
  error?: string
}

async function verifyTokenAddress(
  symbol: string,
  expectedName: string,
  address: string
): Promise<VerificationResult> {
  try {
    const metadata = await alchemy.core.getTokenMetadata(address)
    
    // Strict verification - symbol must match exactly (case-insensitive)
    const verified = metadata.symbol?.toUpperCase() === symbol.toUpperCase()

    return {
      symbol,
      expectedName,
      address,
      verified,
      actualSymbol: metadata.symbol || undefined,
      actualName: metadata.name || undefined,
    }
  } catch (error: any) {
    return {
      symbol,
      expectedName,
      address,
      verified: false,
      error: error.message || "Unknown error",
    }
  }
}

async function verifyNFTCollection(
  name: string,
  address: string
): Promise<VerificationResult> {
  try {
    // For NFTs, we can check if the contract exists and get basic info
    const metadata = await alchemy.nft.getContractMetadata(address)
    
    // Strict verification for NFTs - check if contract exists and name/symbol matches
    // For collections with spaces vs no spaces, we'll be lenient (e.g., "Bored Ape" vs "BoredApe")
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "")
    const nameNormalized = normalize(name)
    const actualNameNormalized = normalize(metadata.name || "")
    const actualSymbolNormalized = normalize(metadata.symbol || "")
    
    // Match if normalized names are the same, or if symbol matches
    const verified = 
      nameNormalized === actualNameNormalized ||
      nameNormalized === actualSymbolNormalized ||
      actualNameNormalized.includes(nameNormalized) ||
      nameNormalized.includes(actualNameNormalized)

    return {
      symbol: name,
      expectedName: name,
      address,
      verified,
      actualSymbol: metadata.symbol || undefined,
      actualName: metadata.name || undefined,
    }
  } catch (error: any) {
    return {
      symbol: name,
      expectedName: name,
      address,
      verified: false,
      error: error.message || "Unknown error",
    }
  }
}

async function main() {
  console.log("🔍 Verifying token and NFT collection addresses...\n")

  const tokenResults: VerificationResult[] = []
  const nftResults: VerificationResult[] = []

  // Verify tokens
  console.log("📊 Verifying tokens...")
  for (const [symbol, token] of Object.entries(tokensConfig.tokens)) {
    const result = await verifyTokenAddress(symbol, token.name, token.address)
    tokenResults.push(result)
    
    if (result.verified) {
      console.log(`  ✅ ${symbol}: ${result.actualName || token.name}`)
    } else {
      console.log(`  ❌ ${symbol}: ${result.error || `Expected ${token.name}, got ${result.actualName || result.actualSymbol || "unknown"}`}`)
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log("\n🖼️  Verifying NFT collections...")
  // Verify NFT collections
  for (const [key, collection] of Object.entries(collectionsConfig.collections)) {
    const result = await verifyNFTCollection(collection.name, collection.address)
    nftResults.push(result)
    
    if (result.verified) {
      console.log(`  ✅ ${collection.name}: ${result.actualName || collection.name}`)
    } else {
      console.log(`  ❌ ${collection.name}: ${result.error || `Expected ${collection.name}, got ${result.actualName || result.actualSymbol || "unknown"}`}`)
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Summary
  console.log("\n📈 Summary:")
  const tokenVerified = tokenResults.filter(r => r.verified).length
  const tokenFailed = tokenResults.filter(r => !r.verified).length
  const nftVerified = nftResults.filter(r => r.verified).length
  const nftFailed = nftResults.filter(r => !r.verified).length

  console.log(`  Tokens: ${tokenVerified}/${tokenResults.length} verified, ${tokenFailed} failed`)
  console.log(`  NFTs: ${nftVerified}/${nftResults.length} verified, ${nftFailed} failed`)

  if (tokenFailed > 0 || nftFailed > 0) {
    console.log("\n❌ Failed verifications:")
    tokenResults
      .filter(r => !r.verified)
      .forEach(r => {
        console.log(`  Token ${r.symbol}: ${r.address}`)
        if (r.error) console.log(`    Error: ${r.error}`)
        if (r.actualName) console.log(`    Got: ${r.actualName} (${r.actualSymbol})`)
      })
    nftResults
      .filter(r => !r.verified)
      .forEach(r => {
        console.log(`  NFT ${r.symbol}: ${r.address}`)
        if (r.error) console.log(`    Error: ${r.error}`)
        if (r.actualName) console.log(`    Got: ${r.actualName} (${r.actualSymbol})`)
      })
    process.exit(1)
  } else {
    console.log("\n✅ All addresses verified successfully!")
    process.exit(0)
  }
}

main().catch((error) => {
  console.error("❌ Verification script failed:", error)
  process.exit(1)
})

