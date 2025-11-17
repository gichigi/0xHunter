import { Network, Alchemy } from "alchemy-sdk"

const apiKey = process.env.ALCHEMY_API_KEY

if (!apiKey) {
  throw new Error("ALCHEMY_API_KEY environment variable is required. Please add it to your .env.local file.")
}

if (apiKey.length < 20) {
  throw new Error(`API key appears to be incomplete. Length: ${apiKey.length}. Expected length: 32+ characters`)
}

const settings = {
  apiKey: apiKey.trim(),
  network: Network.ETH_MAINNET,
  connectionInfoOverrides: {
    // Note: Can't override fetch directly via ConnectionInfo
    // SDK methods may fail in Next.js server due to ethers.js referrer header issue
    // Fallback to direct RPC is implemented in executeApiCall()
    headers: {},
  },
}

export const alchemy = new Alchemy(settings)
export { Network }
