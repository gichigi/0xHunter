import { isAddress } from "@ethersproject/address"

export function validateQuery(query: string): { valid: boolean; error?: string } {
  // Always check length
  if (query.length < 3) {
    return { valid: false, error: "0xHunter needs more to track. Query must be at least 3 characters." }
  }
  if (query.length > 500) {
    return { valid: false, error: "The path is too long. Query must be under 500 characters." }
  }

  // Only validate addresses IF addresses are detected
  const addressMatches = query.match(/0x[a-fA-F0-9]{40}/g) || []
  if (addressMatches.length > 0) {
    // Validate each detected address
    for (const address of addressMatches) {
      if (!isAddress(address)) {
        return { 
          valid: false, 
          error: `0xHunter cannot track this target - invalid address format: ${address.slice(0, 10)}...` 
        }
      }
    }
  }

  // Valid if length passes and any addresses found are valid
  return { valid: true }
}

