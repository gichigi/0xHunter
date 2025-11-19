"use client"

import { AddressAnalysisCard } from "./address-analysis-card"

interface ResultData {
  address?: string
  shortAddress?: string
  profit?: string
  profitUsd?: number
  transactions?: number
  status?: string
  risk?: string
  tags?: string[]
  tokenHoldings?: Array<{
    symbol: string
    name: string
    balance: string
    contractAddress: string
  }>
}

interface ResultRendererProps {
  type: string
  results: ResultData[]
}

export function ResultRenderer({ type, results }: ResultRendererProps) {
  if (!results || results.length === 0) {
    return (
      <div className="bg-gray-950/60 rounded-lg p-6 border border-gray-800/50 text-center">
        <p className="text-gray-300 font-serif italic">0xHunter has nothing to report.</p>
      </div>
    )
  }

  switch (type) {
    case "address_analysis":
      return (
        <div className="space-y-4">
          {results.map((result, index) => (
            <AddressAnalysisCard key={result.address || index} data={result} />
          ))}
        </div>
      )

    case "token_analysis":
    case "whale_tracking":
    case "transaction_history":
    case "profit_analysis":
    case "contract_interaction":
    case "airdrop_analysis":
    case "unknown":
    default:
      // Generic fallback display for unrecognized or not-yet-implemented types
      return (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-gray-950/60 rounded-lg p-4 border border-gray-800/50">
              <p className="text-gray-400 font-serif text-sm mb-2">Target {index + 1}:</p>
              <div className="space-y-2">
                {Object.entries(result).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="text-gray-400 font-serif text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                    </span>
                    <span className="text-white font-mono text-sm break-all">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
  }
}
