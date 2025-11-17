"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Target } from "lucide-react"

export default function TestAlchemyPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/test-alchemy")
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to connect to test API",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black"></div>

      {/* Header */}
      <header className="relative border-b border-gray-800/50 px-4 sm:px-6 py-4 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
            <h1 className="text-xl sm:text-2xl font-serif tracking-wide text-white drop-shadow-lg">The Hunter</h1>
          </div>
          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-800 text-white hover:bg-gray-700 font-serif border border-gray-600"
          >
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-serif mb-4 text-white drop-shadow-lg">Alchemy Connection Test</h2>
          <p className="text-gray-300 font-serif mb-8">Testing if The Hunter can see into the dark forest...</p>

          <Button
            onClick={runTest}
            disabled={loading}
            className="bg-gray-800 text-white hover:bg-gray-700 font-serif border border-gray-600 px-6 py-3 text-lg shadow-lg"
          >
            {loading ? "Testing Connection..." : "Test Alchemy Connection"}
          </Button>
        </div>

        {/* Results */}
        {testResult && (
          <div className="mt-8">
            <div
              className={`bg-gray-950/60 rounded-lg p-6 border backdrop-blur-sm shadow-xl ${
                testResult.success ? "border-green-600/50 shadow-green-500/20" : "border-red-600/50 shadow-red-500/20"
              }`}
            >
              <h3 className={`text-xl font-serif mb-4 ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                {testResult.success ? "✅ Connection Successful!" : "❌ Connection Failed"}
              </h3>

              <p className="text-gray-300 font-serif mb-4 italic">{testResult.message}</p>

              {testResult.success && testResult.data && (
                <div className="space-y-4">
                  <div className="bg-gray-900/50 rounded p-4">
                    <h4 className="text-white font-serif mb-2">Latest Block:</h4>
                    <p className="text-gray-300 font-mono">{testResult.data.latestBlock}</p>
                  </div>

                  <div className="bg-gray-900/50 rounded p-4">
                    <h4 className="text-white font-serif mb-2">Network:</h4>
                    <p className="text-gray-300">
                      {testResult.data.network.name} (Chain ID: {testResult.data.network.chainId})
                    </p>
                  </div>

                  <div className="bg-gray-900/50 rounded p-4">
                    <h4 className="text-white font-serif mb-2">Test Balance (Vitalik's Address):</h4>
                    <p className="text-gray-300 font-mono text-sm">{testResult.data.testBalance.address}</p>
                    <p className="text-gray-300">{testResult.data.testBalance.balanceInEth.toFixed(4)} ETH</p>
                  </div>
                </div>
              )}

              {!testResult.success && testResult.error && (
                <div className="bg-red-900/20 rounded p-4 mt-4">
                  <h4 className="text-red-400 font-serif mb-2">Error Details:</h4>
                  <p className="text-red-300 font-mono text-sm">{testResult.error}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
