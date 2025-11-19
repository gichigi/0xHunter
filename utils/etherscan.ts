/**
 * Etherscan API integration for token holder queries
 * Used for queries like "top holders of token X" which Alchemy doesn't support
 * 
 * NOTE: This is not used in V1. Reserved for post-V1 features.
 * See ROADMAP.md for details on deferred features.
 */

const ETHERSCAN_API_URL = "https://api.etherscan.io/api"

const apiKey = process.env.ETHERSCAN_API_KEY

if (!apiKey) {
  console.warn("ETHERSCAN_API_KEY not set. Token holder queries will not work.")
}

interface EtherscanResponse<T> {
  status: string
  message: string
  result: T
}

interface TokenHolder {
  address: string
  balance: string
  balanceFormatted?: number
}

/**
 * Get top token holders for a given token contract address
 * Returns up to 100 holders sorted by balance (descending)
 */
export async function getTokenHolders(
  contractAddress: string,
  limit: number = 100
): Promise<TokenHolder[] | null> {
  try {
    if (!apiKey) {
      console.error("ETHERSCAN_API_KEY not configured")
      return null
    }

    const url = `${ETHERSCAN_API_URL}?module=token&action=tokenholderlist&contractaddress=${contractAddress}&page=1&offset=${limit}&apikey=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Etherscan API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data: EtherscanResponse<TokenHolder[]> = await response.json()

    if (data.status !== "1" || data.message !== "OK") {
      console.error(`Etherscan API error: ${data.message}`)
      return null
    }

    // Format balances (they come as strings, convert to numbers for sorting)
    const holders = (data.result || []).map((holder) => ({
      ...holder,
      balanceFormatted: parseFloat(holder.balance) || 0,
    }))

    // Sort by balance descending (Etherscan should already do this, but ensure it)
    holders.sort((a, b) => b.balanceFormatted - a.balanceFormatted)

    return holders.slice(0, limit)
  } catch (error) {
    console.error("Etherscan getTokenHolders failed:", error)
    return null
  }
}

/**
 * Get total supply of a token
 */
export async function getTokenTotalSupply(contractAddress: string): Promise<string | null> {
  try {
    if (!apiKey) {
      console.error("ETHERSCAN_API_KEY not configured")
      return null
    }

    const url = `${ETHERSCAN_API_URL}?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Etherscan API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data: EtherscanResponse<string> = await response.json()

    if (data.status !== "1" || data.message !== "OK") {
      console.error(`Etherscan API error: ${data.message}`)
      return null
    }

    return data.result
  } catch (error) {
    console.error("Etherscan getTokenTotalSupply failed:", error)
    return null
  }
}

