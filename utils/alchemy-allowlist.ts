/**
 * Allowlist of safe Alchemy SDK methods
 * Format: {namespace}.{method} (e.g., "core.getBalance")
 * 
 * Methods are validated against this list before execution
 * to ensure only safe, read-only operations are allowed.
 */

export const ALCHEMY_ALLOWLIST = [
  // Core methods
  "core.getBalance",
  "core.getTransactionCount",
  "core.getTokenBalances",
  "core.getTokenMetadata",
  "core.getAssetTransfers",
  "core.getLogs",
  
  // NFT methods
  "nft.getNftsForOwner",
  "nft.getOwnersForContract",
  "nft.getOwnersForNft",
] as const

export type AllowedMethod = typeof ALCHEMY_ALLOWLIST[number]

/**
 * Check if a method path is in the allowlist
 */
export function isMethodAllowed(methodPath: string): boolean {
  return ALCHEMY_ALLOWLIST.includes(methodPath as AllowedMethod)
}

/**
 * Get all allowed methods (for AI prompt)
 */
export function getAllowedMethods(): readonly string[] {
  return ALCHEMY_ALLOWLIST
}

/**
 * Method descriptions for AI prompt
 */
export const METHOD_DESCRIPTIONS: Record<string, string> = {
  "core.getBalance": "Get ETH balance for address",
  "core.getTransactionCount": "Get transaction count for address",
  "core.getTokenBalances": "Get all ERC-20 token balances for address",
  "core.getTokenMetadata": "Get token name/symbol/decimals by contract address (use for token price queries - price fetched separately)",
  "core.getAssetTransfers": "Get transfer history (ERC-20, ERC-721, ERC-1155) with filters (fromAddress, toAddress, contractAddresses, category, fromBlock, toBlock)",
  "core.getLogs": "Get contract event logs",
  "nft.getNftsForOwner": "Get NFTs owned by address (use when query mentions NFTs/collections)",
  "nft.getOwnersForContract": "Get all owners of an NFT collection (use for 'how many holders' or 'top holders' queries)",
  "nft.getOwnersForNft": "Get owners of a specific NFT token ID",
}

/**
 * Get formatted method list for AI prompt
 */
export function getFormattedMethodList(): string {
  const methods = getAllowedMethods()
  return methods
    .map(method => {
      const desc = METHOD_DESCRIPTIONS[method] || "Alchemy SDK method"
      return `- alchemy_call("${method}", params) → ${desc}`
    })
    .join("\n")
}

