"use client"

import type React from "react"

import { useState } from "react"
import { Search, Target, Wifi, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EthereumLogo } from "@/components/ethereum-logo"

const exampleQueries = [
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "How much ETH does 0x8133a5dcba30387e88b8dd3b782797ae00defcc0 have?",
  "Show me token balances for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "Analyze this wallet: 0x8133a5dcba30387e88b8dd3b782797ae00defcc0",
]

export default function HomePage() {
  const [query, setQuery] = useState("")
  const [selectedExample, setSelectedExample] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const handleExampleClick = (example: string) => {
    setQuery(example)
    setSelectedExample(example)
  }

  const handleSearch = async () => {
    if (query.trim() && !isSearching) {
      setIsSearching(true)

      try {
        // Call the search API
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: query.trim() }),
        })

        const data = await response.json()

        if (data.success) {
          // Store results in sessionStorage and navigate
          sessionStorage.setItem("searchResults", JSON.stringify(data.data))
          window.location.href = `/results?q=${encodeURIComponent(query.trim())}`
        } else {
          console.error("Search failed:", data.error)
          alert("Search failed: " + (data.message || data.error))
          setIsSearching(false)
        }
      } catch (error) {
        console.error("Search error:", error)
        alert("Search failed. Please try again.")
        setIsSearching(false)
      }
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)

    const testQuery = "Analyze wallet 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: testQuery }),
      })

      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching) {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent_50%)]"></div>

      {/* Header */}
      <header className="relative border-b border-gray-800/50 px-4 sm:px-6 py-4 backdrop-blur-sm bg-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
            <h1 className="text-xl sm:text-2xl font-serif tracking-wide text-white drop-shadow-lg">The Hunter</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <a href="#" className="text-gray-300 hover:text-white transition-colors font-serif text-sm drop-shadow-sm">
              Search
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors font-serif text-sm drop-shadow-sm">
              History
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors font-serif text-sm drop-shadow-sm">
              Pricing
            </a>
          </nav>

          {/* Connect Button - Always visible */}
          <Button className="bg-gray-800 text-white hover:bg-gray-700 font-serif border border-gray-600 text-sm sm:text-base px-3 sm:px-4 py-2 shadow-lg shadow-gray-900/50 hover:shadow-gray-700/50 transition-all duration-200">
            <Wifi className="w-4 h-4 mr-2" />
            Connect
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="mb-8 sm:mb-12">
            <EthereumLogo className="w-12 h-20 sm:w-16 sm:h-26 mx-auto mb-6 sm:mb-8 text-gray-500 animate-pulse drop-shadow-lg" />
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif mb-4 sm:mb-6 leading-tight tracking-tight px-2 text-white drop-shadow-2xl shadow-black/80">
              The Hunter sees
              <br />
              <span className="text-gray-300 italic drop-shadow-xl">what the dark forest hides.</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed font-serif px-4 drop-shadow-lg">
              Every transaction leaves a trail.
              <br />
              Every wallet tells a story.
            </p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-8 sm:mb-12 px-4 sm:px-0">
            <div className="relative bg-gray-950/90 border-2 border-gray-700 rounded-lg shadow-2xl shadow-black/50 backdrop-blur-sm hover:border-gray-600 focus-within:border-gray-500 focus-within:shadow-gray-500/20 transition-all duration-300">
              <div className="flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-gray-400 z-10" />
                <Input
                  type="text"
                  placeholder="Ask The Hunter..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSearching}
                  className="flex-1 pl-12 pr-32 py-4 bg-transparent border-0 text-white placeholder-gray-400 text-base sm:text-lg font-serif focus:ring-0 focus:outline-none tracking-wide h-14 disabled:opacity-50"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !query.trim()}
                  className="absolute right-2 bg-gray-800 text-white hover:bg-gray-700 font-serif border border-gray-600 px-4 py-2 h-10 shadow-lg shadow-gray-900/50 hover:shadow-gray-700/50 transition-all duration-200 rounded disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                  size="sm"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Hunting...
                    </>
                  ) : (
                    "Hunt"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Test Button */}
          <div className="mb-6 sm:mb-8">
            <Button
              onClick={handleTest}
              disabled={isTesting}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:text-white hover:border-white font-serif text-sm px-4 py-2 bg-transparent"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>🧪 Test AI Agent (Vitalik's Wallet)</>
              )}
            </Button>
          </div>

          {/* Test Results Display */}
          {testResult && (
            <div className="mb-8 max-w-3xl mx-auto">
              <div className="bg-gray-950/60 rounded-lg p-6 border border-gray-800/50 backdrop-blur-sm shadow-xl shadow-black/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-serif text-white flex items-center">
                    <Target className="w-5 h-5 mr-2 text-blue-400" />
                    Test Results
                  </h3>
                  <button onClick={() => setTestResult(null)} className="text-gray-500 hover:text-gray-300 text-sm">
                    ✕ Close
                  </button>
                </div>

                {testResult.success ? (
                  <div className="space-y-4">
                    <div className="bg-gray-900/50 rounded p-3 border border-gray-800/50">
                      <p className="text-sm text-gray-400 mb-1">Status:</p>
                      <p className="text-green-400 font-mono">✅ Success</p>
                    </div>

                    <div className="bg-gray-900/50 rounded p-3 border border-gray-800/50">
                      <p className="text-sm text-gray-400 mb-1">Query Type:</p>
                      <p className="text-blue-400 font-mono">{testResult.data?.type || "unknown"}</p>
                    </div>

                    <div className="bg-gray-900/50 rounded p-3 border border-gray-800/50">
                      <p className="text-sm text-gray-400 mb-1">Confidence:</p>
                      <p className="text-yellow-400 font-mono">
                        {((testResult.data?.confidence || 0) * 100).toFixed(1)}%
                      </p>
                    </div>

                    <div className="bg-gray-900/50 rounded p-3 border border-gray-800/50">
                      <p className="text-sm text-gray-400 mb-1">Hunter's Commentary:</p>
                      <p className="text-gray-300 font-serif italic">"{testResult.data?.commentary || "N/A"}"</p>
                    </div>

                    <div className="bg-gray-900/50 rounded p-3 border border-gray-800/50">
                      <p className="text-sm text-gray-400 mb-1">Results Found:</p>
                      <p className="text-white font-mono">{testResult.data?.results?.length || 0} targets</p>
                    </div>

                    <details className="bg-gray-900/50 rounded p-3 border border-gray-800/50">
                      <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                        View Raw JSON
                      </summary>
                      <pre className="text-xs text-gray-500 mt-2 overflow-auto max-h-64 font-mono">
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <div className="bg-red-900/20 rounded p-4 border border-red-600/50">
                    <p className="text-red-400 font-mono text-sm">❌ Error: {testResult.error || "Unknown error"}</p>
                    {testResult.message && <p className="text-red-300 text-xs mt-2">{testResult.message}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Example Queries */}
          <div className="space-y-4 px-4 sm:px-0">
            <p className="text-gray-400 font-serif text-sm italic tracking-wide mb-4 sm:mb-6 drop-shadow-sm">
              Recent whispers from the shadows
            </p>
            <div className="grid gap-3 max-w-3xl mx-auto">
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  disabled={isSearching}
                  className={`group text-left p-4 sm:p-5 rounded border transition-all duration-300 font-serif text-sm sm:text-base backdrop-blur-sm min-h-[48px] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedExample === example
                      ? "border-gray-500 bg-gray-900/80 text-white shadow-gray-500/20 shadow-xl"
                      : "border-gray-700/70 bg-gray-950/60 text-gray-300 hover:border-gray-600 hover:text-gray-100 hover:bg-gray-900/70 shadow-black/30 hover:shadow-gray-700/30"
                  }`}
                >
                  <span className="text-gray-600 mr-3 sm:mr-4 group-hover:text-gray-400 transition-colors">→</span>
                  <span className="tracking-wide italic">{example}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Atmospheric Section */}
        <div className="text-center mb-12 sm:mb-16 py-8 sm:py-12 px-4 sm:px-0">
          <div className="max-w-2xl mx-auto bg-gray-950/30 rounded-lg p-6 sm:p-8 border border-gray-800/50 backdrop-blur-sm shadow-xl shadow-black/50">
            <p className="text-gray-400 font-serif text-base sm:text-lg italic leading-relaxed drop-shadow-sm">
              In the depths of Ethereum's wilderness, where smart contracts lurk like predators and transactions move
              through shadow pools... few dare to venture alone.
            </p>
            <div className="mt-6 flex justify-center space-x-1">
              <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse shadow-sm shadow-gray-500/50"></div>
              <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse delay-100 shadow-sm shadow-gray-500/50"></div>
              <div className="w-1 h-1 bg-gray-500 rounded-full animate-pulse delay-200 shadow-sm shadow-gray-500/50"></div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700/50 pt-8 sm:pt-12 mt-12 sm:mt-16 px-4 sm:px-0 bg-gradient-to-b from-transparent to-gray-950/20">
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div className="group bg-gray-950/40 p-6 rounded-lg border border-gray-800/50 backdrop-blur-sm shadow-lg shadow-black/30">
              <h3 className="font-serif text-lg sm:text-xl mb-3 tracking-wide text-white drop-shadow-lg">Precision</h3>
              <p className="text-gray-300 font-serif text-sm leading-relaxed italic drop-shadow-sm">
                Every query cuts through the noise.
                <br />
                <span className="text-gray-500">No wasted movements.</span>
              </p>
            </div>
            <div className="group bg-gray-950/40 p-6 rounded-lg border border-gray-800/50 backdrop-blur-sm shadow-lg shadow-black/30">
              <h3 className="font-serif text-lg sm:text-xl mb-3 tracking-wide text-white drop-shadow-lg">Stealth</h3>
              <p className="text-gray-300 font-serif text-sm leading-relaxed italic drop-shadow-sm">
                The forest is vast, but I know
                <br />
                <span className="text-gray-500">every hidden path.</span>
              </p>
            </div>
            <div className="group bg-gray-950/40 p-6 rounded-lg border border-gray-800/50 backdrop-blur-sm shadow-lg shadow-black/30">
              <h3 className="font-serif text-lg sm:text-xl mb-3 tracking-wide text-white drop-shadow-lg">Truth</h3>
              <p className="text-gray-300 font-serif text-sm leading-relaxed italic drop-shadow-sm">
                The blockchain never lies.
                <br />
                <span className="text-gray-500">Neither do I.</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-700/50 mt-16 sm:mt-24 backdrop-blur-sm bg-gray-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <Target className="w-5 h-5 text-gray-500 drop-shadow-sm" />
              <span className="font-serif text-gray-400 italic drop-shadow-sm">The Hunter</span>
            </div>
            <div className="text-gray-500 font-serif text-xs italic text-center sm:text-right drop-shadow-sm">
              Built for those who hunt in the dark
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
