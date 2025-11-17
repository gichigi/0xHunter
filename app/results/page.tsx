"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchData {
  type: string
  query: string
  commentary: string
  results: any[]
  error?: string
  message?: string
  aiReasoning?: string
  confidence?: number
  debug?: any
}

export default function ResultsPage() {
  const [searchData, setSearchData] = useState<SearchData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get search results from sessionStorage
    const storedResults = sessionStorage.getItem("searchResults")
    if (storedResults) {
      try {
        const data = JSON.parse(storedResults)
        setSearchData(data)
      } catch (error) {
        console.error("Failed to parse search results:", error)
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Target className="w-8 h-8 text-white animate-pulse mx-auto mb-4" />
          <p className="text-gray-300 font-serif">The Hunter is tracking...</p>
        </div>
      </div>
    )
  }

  if (!searchData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Target className="w-8 h-8 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-300 font-serif mb-4">No search results found.</p>
          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-800 text-white hover:bg-gray-700 font-serif"
          >
            Return to Hunt
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black"></div>

      {/* Header */}
      <header className="relative border-b border-gray-800/50 px-4 sm:px-6 py-4 backdrop-blur-sm bg-black/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white drop-shadow-lg" />
            <h1 className="text-xl sm:text-2xl font-serif tracking-wide text-white drop-shadow-lg">The Hunter</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Query Display */}
          <div className="bg-gray-950/60 rounded-lg p-4 border border-gray-800/50">
            <p className="text-gray-400 font-serif text-sm mb-2">Query:</p>
            <p className="text-white font-mono text-lg">{searchData.query}</p>
          </div>

          {/* Commentary Display */}
          <div className="bg-gray-950/60 rounded-lg p-4 border border-gray-800/50">
            <p className="text-gray-400 font-serif text-sm mb-2">Hunter's Commentary:</p>
            <p className="text-gray-300 font-serif italic">{searchData.commentary}</p>
          </div>

          {/* Pure Text Output */}
          <div className="bg-gray-950/60 rounded-lg p-6 border border-gray-800/50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 font-serif text-sm">Raw Output:</p>
              <Button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(searchData, null, 2))}
                variant="outline"
                size="sm"
                className="text-xs border-gray-600 text-gray-300"
              >
                Copy JSON
              </Button>
            </div>
            <pre className="text-gray-100 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto bg-gray-900/50 p-4 rounded">
              {JSON.stringify(searchData, null, 2)}
            </pre>
          </div>

          {/* Back Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => (window.location.href = "/")}
              className="bg-gray-800 text-white hover:bg-gray-700 font-serif border border-gray-600 px-6 py-2"
            >
              New Hunt
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
