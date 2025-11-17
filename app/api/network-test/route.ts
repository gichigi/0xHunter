import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== Testing Basic Network Connectivity ===")

    // Test basic fetch to a simple API
    console.log("Testing fetch to httpbin.org...")
    const response = await fetch("https://httpbin.org/get", {
      method: "GET",
      headers: {
        "User-Agent": "v0-test",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("✓ Basic network test successful")

    // Test fetch to Alchemy (without SDK)
    console.log("Testing direct fetch to Alchemy...")
    const alchemyResponse = await fetch("https://eth-mainnet.g.alchemy.com/v2/HvFT9CDpoh__KWYWI2_i2jUyRc5Aqtcv", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1,
      }),
    })

    if (!alchemyResponse.ok) {
      throw new Error(`Alchemy HTTP ${alchemyResponse.status}: ${alchemyResponse.statusText}`)
    }

    const alchemyData = await alchemyResponse.json()
    console.log("✓ Direct Alchemy API test successful")

    return NextResponse.json({
      success: true,
      message: "Network connectivity working!",
      data: {
        basicNetworkTest: {
          status: "success",
          url: "https://httpbin.org/get",
        },
        alchemyDirectTest: {
          status: "success",
          blockNumber: alchemyData.result,
          url: "https://eth-mainnet.g.alchemy.com/v2/...",
        },
      },
    })
  } catch (error) {
    console.error("❌ Network test failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Network connectivity failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
