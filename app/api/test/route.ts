import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Simple direct API call to Alchemy
    const response = await fetch("https://eth-mainnet.g.alchemy.com/v2/HvFT9CDpoh__KWYWI2_i2jUyRc5Aqtcv", {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`Alchemy error: ${data.error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: "Connection successful!",
      data: {
        blockNumber: Number.parseInt(data.result, 16),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
