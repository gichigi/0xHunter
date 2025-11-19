/**
 * NFT collection resolution utility
 * Resolves collection names to contract addresses
 * 
 * V1: Uses static config only (22 curated collections)
 * Post-V1: Will add fallback chain (static → cache → OpenSea/Reservoir API)
 */

import collectionsConfigData from "@/config/nft-collections.json"

const collectionsConfig = collectionsConfigData as {
  collections: Record<string, { name: string; address: string; symbol?: string }>
}

interface NFTCollectionInfo {
  name: string
  address: string
  symbol?: string
}

/**
 * Resolve NFT collection name to contract address
 * Uses static config only
 */
export function resolveNFTCollection(name: string): NFTCollectionInfo | null {
  const normalizedName = name.trim()

  // Try exact match first
  if (collectionsConfig.collections[normalizedName]) {
    const collection = collectionsConfig.collections[normalizedName]
    return {
      name: collection.name,
      address: collection.address,
      symbol: collection.symbol,
    }
  }

  // Try case-insensitive match
  for (const [key, collection] of Object.entries(collectionsConfig.collections)) {
    if (key.toLowerCase() === normalizedName.toLowerCase() || 
        collection.name.toLowerCase() === normalizedName.toLowerCase() ||
        collection.symbol?.toLowerCase() === normalizedName.toLowerCase()) {
      return {
        name: collection.name,
        address: collection.address,
        symbol: collection.symbol,
      }
    }
  }

  return null
}

/**
 * Reverse lookup: Get collection name from contract address
 */
export function getCollectionNameByAddress(address: string): string | null {
  const normalizedAddress = address.toLowerCase()
  for (const [key, collection] of Object.entries(collectionsConfig.collections)) {
    if (collection.address.toLowerCase() === normalizedAddress) {
      return collection.name || key
    }
  }
  return null
}

/**
 * Get all collections from static config
 */
export function getStaticCollections(): Record<string, NFTCollectionInfo> {
  const result: Record<string, NFTCollectionInfo> = {}
  for (const [key, collection] of Object.entries(collectionsConfig.collections)) {
    result[key] = {
      name: collection.name,
      address: collection.address,
      symbol: collection.symbol,
    }
  }
  return result
}

