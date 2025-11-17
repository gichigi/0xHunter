"use client"

import { TagsDisplay } from "./tags-display"
import { TokenHoldingsTable } from "./token-holdings-table"

interface AddressAnalysisData {
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

interface AddressAnalysisCardProps {
  data: AddressAnalysisData
}

export function AddressAnalysisCard({ data }: AddressAnalysisCardProps) {
  const {
    address,
    shortAddress,
    profit,
    profitUsd,
    transactions,
    status,
    risk,
    tags,
    tokenHoldings
  } = data

  return (
    <div className="bg-gray-950/60 rounded-lg border border-gray-800/50 overflow-hidden">
      {/* Header with address */}
      <div className="p-4 border-b border-gray-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-gray-400 font-serif text-sm mb-1">Target:</p>
            <p className="text-white font-mono text-sm sm:text-base break-all">
              {address || shortAddress || "Unknown Address"}
            </p>
          </div>
          {tags && tags.length > 0 && (
            <div className="flex-shrink-0">
              <TagsDisplay tags={tags} />
            </div>
          )}
        </div>
      </div>

      {/* Main stats */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Balance */}
          {profit && (
            <div className="space-y-1">
              <p className="text-gray-400 font-serif text-sm">Balance:</p>
              <p className="text-white font-mono text-lg">{profit}</p>
              {profitUsd !== undefined && (
                <p className="text-gray-500 font-mono text-sm">
                  ${profitUsd.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Transactions */}
          {transactions !== undefined && (
            <div className="space-y-1">
              <p className="text-gray-400 font-serif text-sm">Transactions:</p>
              <p className="text-white font-mono text-lg">{transactions.toLocaleString()}</p>
            </div>
          )}

          {/* Status */}
          {status && (
            <div className="space-y-1">
              <p className="text-gray-400 font-serif text-sm">Status:</p>
              <p className={`font-mono text-sm ${
                status === 'active' ? 'text-green-400' : 
                status === 'inactive' ? 'text-gray-400' : 
                'text-white'
              }`}>
                {status}
              </p>
            </div>
          )}

          {/* Risk */}
          {risk && (
            <div className="space-y-1">
              <p className="text-gray-400 font-serif text-sm">Risk:</p>
              <p className={`font-mono text-sm ${
                risk === 'low' ? 'text-green-400' : 
                risk === 'medium' ? 'text-yellow-400' : 
                risk === 'high' ? 'text-red-400' : 
                'text-white'
              }`}>
                {risk}
              </p>
            </div>
          )}
        </div>

        {/* Token Holdings */}
        {tokenHoldings && tokenHoldings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-gray-400 font-serif text-sm">Token Holdings:</h3>
            <TokenHoldingsTable tokens={tokenHoldings} />
          </div>
        )}
      </div>
    </div>
  )
}
