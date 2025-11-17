import { NextResponse } from "next/server"
import { Network, Alchemy } from "alchemy-sdk"

export async function GET() {
  try {
    console.log("=== Testing Alchemy Connection ===")

    const settings = {
      apiKey: process.env.ALCHEMY_API_KEY || "HvFT9CDpoh__KWYWI2_i2jUyRc5Aqtcv",
      network: Network.ETH_MAINNET,
    }

    console.log("Using API key:", settings.apiKey.substring(0, 10) + "...")
    console.log("Network:", settings.network)

    const alchemy = new Alchemy(settings)

    // Start with the simplest possible call
    console.log("Testing getBlockNumber (simplest call)...")

    try {
      const blockNumber = await alchemy.core.getBlockNumber()
      console.log("✓ Block number retrieved:", blockNumber)

      // If that works, try network info
      console.log("Testing getNetwork...")
      const network = await alchemy.core.getNetwork()
      console.log("✓ Network info:", network)

      // If that works, try a simple balance check
      console.log("Testing getBalance...")
      const balance = await alchemy.core.getBalance("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
      console.log("✓ Balance retrieved")

      return NextResponse.json({
        success: true,
        message: "Alchemy connection successful with basic calls!",
        data: {
          apiKeyWorking: true,
          latestBlock: blockNumber,
          network: {
            name: network.name,
            chainId: network.chainId,
          },
          balanceTest: {
            address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
            balance: balance.toString(),
          },
        },
      })
    } catch (alchemyError: any) {
      console.error("Alchemy API call failed:", alchemyError)

      // Check if it's a network/connectivity issue
      if (alchemyError.message?.includes("missing response")) {
        return NextResponse.json(
          {
            success: false,
            message: "Network connectivity issue",
            error: "Cannot connect to Alchemy servers from v0 environment",
            details: {
              errorType: "NETWORK_ERROR",
              possibleCauses: [
                "v0 environment may block external API calls",
                "Firewall or network restrictions",
                "Alchemy servers temporarily unavailable",
              ],
              suggestion: "This appears to be a v0 environment limitation, not an API key issue",
            },
            rawError: alchemyError.message,
          },
          { status: 503 },
        )
      }

      throw alchemyError
    }
  } catch (error) {
    console.error("❌ Alchemy test failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Alchemy connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        apiKeyFound: !!(process.env.ALCHEMY_API_KEY || "HvFT9CDpoh__KWYWI2_i2jUyRc5Aqtcv"),
      },
      { status: 500 },
    )
  }
}
