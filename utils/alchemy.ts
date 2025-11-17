import { Network, Alchemy } from "alchemy-sdk"

// Using local .env file instead of v0 environment variables
const apiKey = process.env.ALCHEMY_API_KEY || "HvFT9CDpoh__KWYWI2_i2jUyRc5Aqtcv"

console.log("Reading API key from .env.local file")
console.log("API Key exists:", !!apiKey)
console.log("API Key length:", apiKey?.length)
console.log("API Key starts with:", apiKey?.substring(0, 10) + "...")

if (!apiKey) {
  throw new Error("ALCHEMY_API_KEY not found in .env.local file")
}

if (apiKey.length < 20) {
  throw new Error(`API key appears to be incomplete. Length: ${apiKey.length}. Expected length: 32+ characters`)
}

const settings = {
  apiKey: apiKey.trim(),
  network: Network.ETH_MAINNET,
}

console.log("Creating Alchemy instance with settings:", {
  network: settings.network,
  apiKeyLength: settings.apiKey.length,
  apiKeyPrefix: settings.apiKey.substring(0, 10),
})

export const alchemy = new Alchemy(settings)
export { Network }
