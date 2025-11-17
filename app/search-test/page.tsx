"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Target } from "lucide-react"

export default function SearchTestPage() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSearch = async () => {
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

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Target className="w-8 h-8 text-white" />
          <h1 className="text-2xl font-serif text-white">Search API Test</h1>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex space-x-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search query..."
              className="flex-1 bg-gray-900 border-gray-700 text-white"
              onKeyPress={(e) => e.key === "Enter" && testSearch()}
            />
            <Button onClick={testSearch} disabled={loading || !query.trim()} className="bg-gray-800 hover:bg-gray-700">
              {loading ? "Testing..." : "Test Search"}
            </Button>
          </div>

          <div className="text-sm text-gray-400">
            <p>Try these examples:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <button
                  onClick={() => setQuery("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")}
                  className="text-blue-400 hover:underline"
                >
                  Address lookup
                </button>
              </li>
              <li>
                <button
                  onClick={() => setQuery("Which address made the most profit from $DOGE?")}
                  className="text-blue-400 hover:underline"
                >
                  Token analysis
                </button>
              </li>
              <li>
                <button onClick={() => setQuery("What was my best trade?")} className="text-blue-400 hover:underline">
                  Profit analysis
                </button>
              </li>
              <li>
                <button
                  onClick={() => setQuery("Which airdrops did I miss?")}
                  className="text-blue-400 hover:underline"
                >
                  Airdrop analysis
                </button>
              </li>
            </ul>
          </div>
        </div>

        {result && (
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-serif mb-4 text-white">Search Result:</h3>
            <pre className="text-sm text-gray-300 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
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
