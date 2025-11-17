"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Target, Brain, Loader2 } from "lucide-react"

export default function AITestPage() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testQueries = [
    // Address Analysis - These should work well
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "0x8133a5dcba30387e88b8dd3b782797ae00defcc0",
    "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503",
    "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",

    // Address Analysis with Context
    "Analyze wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "How much ETH does 0x8133a5dcba30387e88b8dd3b782797ae00defcc0 have?",
    "Show me token balances for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "What NFTs does 0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE own?",

    // Transaction Count Queries
    "How many transactions has 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 made?",
    "Transaction count for 0x8133a5dcba30387e88b8dd3b782797ae00defcc0",

    // Multi-address Analysis
    "Compare 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 and 0x8133a5dcba30387e88b8dd3b782797ae00defcc0",
    "Analyze these wallets: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045, 0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",

    // Queries that should trigger different intents but still work
    "Show me Vitalik's wallet balance", // Should extract Vitalik's known address
    "Ethereum Foundation treasury analysis", // Should be address analysis
  ]

  const testAISearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  const getIntentColor = (intent: string) => {
    const colors: { [key: string]: string } = {
      address_analysis: "text-blue-400",
      token_analysis: "text-green-400",
      whale_tracking: "text-purple-400",
      transaction_history: "text-yellow-400",
      profit_analysis: "text-orange-400",
      contract_interaction: "text-pink-400",
      airdrop_analysis: "text-cyan-400",
      unknown: "text-gray-400",
    }
    return colors[intent] || "text-gray-400"
  }

  const getIntentIcon = (intent: string) => {
    const icons: { [key: string]: string } = {
      address_analysis: "🔍",
      token_analysis: "🪙",
      whale_tracking: "🐋",
      transaction_history: "📜",
      profit_analysis: "💰",
      contract_interaction: "⚙️",
      airdrop_analysis: "🎁",
      unknown: "❓",
    }
    return icons[intent] || "❓"
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Target className="w-8 h-8 text-white" />
          <Brain className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-serif text-white">Enhanced AI Agent Test</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask The Hunter anything..."
                className="flex-1 bg-gray-900 border-gray-700 text-white"
                onKeyPress={(e) => e.key === "Enter" && testAISearch()}
              />
              <Button
                onClick={testAISearch}
                disabled={loading || !query.trim()}
                className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Hunting...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Hunt
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-400">Try these enhanced query types:</p>

              {/* Group queries by type */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-blue-400 mb-2">🔍 Direct Address Analysis</p>
                  {testQueries.slice(0, 4).map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(example)}
                      className="block w-full text-left p-2 text-sm bg-gray-900 hover:bg-gray-800 rounded border border-gray-700 text-gray-300 mb-1 font-mono"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                <div>
                  <p className="text-xs text-green-400 mb-2">💬 Address Analysis with Context</p>
                  {testQueries.slice(4, 8).map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(example)}
                      className="block w-full text-left p-2 text-sm bg-gray-900 hover:bg-gray-800 rounded border border-gray-700 text-gray-300 mb-1"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                <div>
                  <p className="text-xs text-yellow-400 mb-2">📊 Transaction Analysis</p>
                  {testQueries.slice(8, 10).map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(example)}
                      className="block w-full text-left p-2 text-sm bg-gray-900 hover:bg-gray-800 rounded border border-gray-700 text-gray-300 mb-1"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                <div>
                  <p className="text-xs text-purple-400 mb-2">🔄 Multi-Address Analysis</p>
                  {testQueries.slice(10, 12).map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(example)}
                      className="block w-full text-left p-2 text-sm bg-gray-900 hover:bg-gray-800 rounded border border-gray-700 text-gray-300 mb-1"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                <div>
                  <p className="text-xs text-orange-400 mb-2">🎯 Named Entity Analysis</p>
                  {testQueries.slice(12, 14).map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(example)}
                      className="block w-full text-left p-2 text-sm bg-gray-900 hover:bg-gray-800 rounded border border-gray-700 text-gray-300 mb-1"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {result && (
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-serif mb-4 text-white flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-400" />
                  AI Analysis
                </h3>

                {result.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Intent:</p>
                        <p className={`font-mono flex items-center ${getIntentColor(result.data.type)}`}>
                          <span className="mr-2">{getIntentIcon(result.data.type)}</span>
                          {result.data.type}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Confidence:</p>
                        <p className="text-yellow-400">{((result.data.confidence || 0) * 100).toFixed(1)}%</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Hunter's Commentary:</p>
                      <p className="text-gray-300 italic font-serif bg-gray-800 p-3 rounded">
                        "{result.data.commentary}"
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">AI Reasoning:</p>
                      <p className="text-gray-400 text-sm bg-gray-800 p-3 rounded">{result.data.aiReasoning}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Extracted Data:</p>
                      <div className="text-sm bg-gray-800 p-3 rounded">
                        {result.data.debug?.extractedData?.addresses && (
                          <p className="text-blue-300">
                            Addresses: {result.data.debug.extractedData.addresses.join(", ")}
                          </p>
                        )}
                        {result.data.debug?.extractedData?.tokens && (
                          <p className="text-green-300">Tokens: {result.data.debug.extractedData.tokens.join(", ")}</p>
                        )}
                        {result.data.debug?.extractedData?.amounts && (
                          <p className="text-yellow-300">
                            Amounts: {result.data.debug.extractedData.amounts.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 mb-1">Results:</p>
                      <p className="text-gray-300">{result.data.results?.length || 0} targets found</p>
                    </div>

                    {result.data.error && (
                      <div className="bg-yellow-900/20 p-3 rounded border border-yellow-600/50">
                        <p className="text-yellow-400 text-sm font-mono">{result.data.error}</p>
                        <p className="text-yellow-300 text-xs mt-1">{result.data.message}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-400">
                    <p className="font-mono text-sm">Error: {result.error}</p>
                    <p className="text-gray-400 text-sm mt-2">{result.message}</p>
                  </div>
                )}

                <details className="mt-4">
                  <summary className="text-gray-400 cursor-pointer text-sm">Raw Response</summary>
                  <pre className="text-xs text-gray-500 mt-2 overflow-auto bg-gray-950 p-2 rounded max-h-64">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
