"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Target, Brain, Loader2 } from "lucide-react"

export default function SimpleAITestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSimpleAI = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Test with a simple, known address
      const testQuery = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Target className="w-8 h-8 text-white" />
          <Brain className="w-8 h-8 text-blue-400" />
          <h1 className="text-2xl font-serif text-white">Simple AI Test</h1>
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-300 font-serif mb-6">
            Testing AI agent with Vitalik's address: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
          </p>

          <Button onClick={testSimpleAI} disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI is thinking...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Test AI Agent
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-serif mb-4 text-white">Test Result:</h3>

            {result.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400 ml-2">✅ Success</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Intent:</span>
                    <span className="text-blue-400 ml-2">{result.data.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Confidence:</span>
                    <span className="text-yellow-400 ml-2">{((result.data.confidence || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Results:</span>
                    <span className="text-white ml-2">{result.data.results?.length || 0} found</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Hunter's Commentary:</p>
                  <p className="text-gray-300 italic font-serif bg-gray-800 p-3 rounded">"{result.data.commentary}"</p>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">AI Reasoning:</p>
                  <p className="text-gray-400 text-sm bg-gray-800 p-3 rounded">{result.data.aiReasoning}</p>
                </div>

                {result.data.results && result.data.results.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Address Analysis:</p>
                    <div className="bg-gray-800 p-3 rounded">
                      {result.data.results.map((addr: any, idx: number) => (
                        <div key={idx} className="text-sm">
                          <p className="text-white">
                            {addr.shortAddress} - {addr.profit} ({addr.transactions} txs)
                          </p>
                          <p className="text-gray-400">
                            {addr.tokenHoldings?.length || 0} tokens, Status: {addr.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-400">
                <p className="font-mono">❌ Error: {result.error}</p>
                <p className="text-sm mt-2">{result.message}</p>
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
