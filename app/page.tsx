"use client"

import type React from "react"

import { useState } from "react"
import { Search, Target, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EthereumLogo } from "@/components/ethereum-logo"
import { validateQuery } from "@/utils/validation"

export default function HomePage() {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (query.trim() && !isSearching) {
      setIsSearching(true)
      setError(null)

      // Validate query before API call
      const validation = validateQuery(query.trim())
      if (!validation.valid) {
        setError(validation.error || "0xHunter cannot track this target...")
        setIsSearching(false)
        return
      }

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
          // Encode results in URL for shareability
          const encodedResults = encodeURIComponent(JSON.stringify(data.data))
          window.location.href = `/results?q=${encodeURIComponent(query.trim())}&data=${encodedResults}`
        } else {
          console.error("Search failed:", data.error)
          setError(data.message || data.error || "0xHunter cannot track this target...")
          setIsSearching(false)
        }
      } catch (error) {
        console.error("Search error:", error)
        setError("The digital mists are too thick. 0xHunter cannot pierce this veil...")
        setIsSearching(false)
      }
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
            <h1 className="text-xl sm:text-2xl font-mono tracking-wide text-white drop-shadow-lg">0xHunter</h1>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="mb-8 sm:mb-12">
            <EthereumLogo className="w-12 h-20 sm:w-16 sm:h-26 mx-auto mb-6 sm:mb-8 text-gray-500 animate-pulse drop-shadow-lg" />
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif mb-4 sm:mb-6 leading-tight tracking-tight px-2 text-white drop-shadow-2xl shadow-black/80">
              0xHunter sees
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
                  placeholder="Ask 0xHunter..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setError(null) // Clear error on input change
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={isSearching}
                  className="flex-1 pl-12 pr-36 sm:pr-40 py-4 bg-transparent border-0 text-white placeholder-gray-400 text-base sm:text-lg font-serif focus:ring-0 focus:outline-none tracking-wide h-14 disabled:opacity-50"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !query.trim()}
                  className="absolute right-2 bg-gray-800 text-white hover:bg-gray-700 font-serif border border-gray-600 px-4 py-2 h-10 shadow-lg shadow-gray-900/50 hover:shadow-gray-700/50 transition-all duration-200 rounded disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
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
            
            {/* Error Message */}
            {error && (
              <div className="mt-4 bg-red-950/30 rounded-lg p-4 border border-red-800/50">
                <p className="text-red-300 font-serif italic text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Query Suggestions */}
          <div className="max-w-2xl mx-auto px-4 sm:px-0">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => {
                  setQuery("Balance of 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
                  setError(null)
                }}
                className="px-4 py-2 bg-gray-950/60 border border-gray-700 rounded-lg text-gray-300 font-serif text-sm hover:border-gray-600 hover:text-white transition-all duration-200"
              >
                Balance of 0xd8dA...
              </button>
              <button
                onClick={() => {
                  setQuery("What does 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 hold?")
                  setError(null)
                }}
                className="px-4 py-2 bg-gray-950/60 border border-gray-700 rounded-lg text-gray-300 font-serif text-sm hover:border-gray-600 hover:text-white transition-all duration-200"
              >
                What does 0xd8dA... hold?
              </button>
              <button
                onClick={() => {
                  setQuery("Price of UNI")
                  setError(null)
                }}
                className="px-4 py-2 bg-gray-950/60 border border-gray-700 rounded-lg text-gray-300 font-serif text-sm hover:border-gray-600 hover:text-white transition-all duration-200"
              >
                Price of UNI
              </button>
              <button
                onClick={() => {
                  setQuery("Does 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 own BAYC?")
                  setError(null)
                }}
                className="px-4 py-2 bg-gray-950/60 border border-gray-700 rounded-lg text-gray-300 font-serif text-sm hover:border-gray-600 hover:text-white transition-all duration-200"
              >
                Does 0xd8dA... own BAYC?
              </button>
              <button
                onClick={() => {
                  setQuery("Analyze 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
                  setError(null)
                }}
                className="px-4 py-2 bg-gray-950/60 border border-gray-700 rounded-lg text-gray-300 font-serif text-sm hover:border-gray-600 hover:text-white transition-all duration-200"
              >
                Analyze 0xd8dA...
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-800/30 mt-24 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-center">
            <Target className="w-4 h-4 text-gray-600 mr-2" />
            <span className="font-serif text-gray-500 text-xs italic">0xHunter</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
