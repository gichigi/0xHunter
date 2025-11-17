"use client"

interface TokenHolding {
  symbol: string
  name: string
  balance: string
  contractAddress: string
}

interface TokenHoldingsTableProps {
  tokens: TokenHolding[]
}

export function TokenHoldingsTable({ tokens }: TokenHoldingsTableProps) {
  if (!tokens || tokens.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-4 text-center">
        <p className="text-gray-400 font-serif italic text-sm">No tokens detected.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 rounded-lg overflow-hidden">
      {/* Desktop table view */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800/50">
                <th className="text-left p-3 text-gray-400 font-serif text-sm">Symbol</th>
                <th className="text-left p-3 text-gray-400 font-serif text-sm">Name</th>
                <th className="text-right p-3 text-gray-400 font-serif text-sm">Balance</th>
                <th className="text-left p-3 text-gray-400 font-serif text-sm">Contract</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, index) => (
                <tr key={token.contractAddress || index} className="border-b border-gray-800/30 last:border-b-0">
                  <td className="p-3">
                    <span className="text-white font-mono text-sm font-medium">
                      {token.symbol}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-gray-300 font-serif text-sm">
                      {token.name}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-white font-mono text-sm">
                      {token.balance}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-gray-400 font-mono text-xs break-all">
                      {token.contractAddress.slice(0, 6)}...{token.contractAddress.slice(-4)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile stacked view */}
      <div className="sm:hidden space-y-3 p-3">
        {tokens.map((token, index) => (
          <div key={token.contractAddress || index} className="bg-gray-800/30 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-mono text-sm font-medium">{token.symbol}</p>
                <p className="text-gray-300 font-serif text-xs">{token.name}</p>
              </div>
              <p className="text-white font-mono text-sm">{token.balance}</p>
            </div>
            <div>
              <p className="text-gray-400 font-serif text-xs mb-1">Contract:</p>
              <p className="text-gray-400 font-mono text-xs break-all">
                {token.contractAddress}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
