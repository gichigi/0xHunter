"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Target, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RawJsonAccordion } from "@/components/results/raw-json-accordion"
import { ResultRenderer } from "@/components/results/result-renderer"
import ReactMarkdown from "react-markdown"

interface SearchData {
  type: string
  query: string
  response?: string
  results: any[]
  error?: string
  message?: string
  aiReasoning?: string
  confidence?: number
  scope?: string
  debug?: any
}

function ResultsContent() {
  const searchParams = useSearchParams()
  const [searchData, setSearchData] = useState<SearchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    // Get search results from URL params
    const dataParam = searchParams.get("data")
    if (dataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(dataParam))
        setSearchData(data)
        
        // Update document title with query in brand voice
        const query = searchParams.get("q") || data.query || ""
        if (query) {
          document.title = `0xHunter | ${query.substring(0, 60)}${query.length > 60 ? "..." : ""}`
        }
      } catch (error) {
        console.error("Failed to parse search results from URL:", error)
      }
    }
    setLoading(false)
  }, [searchParams])

  const handleCopyLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  useEffect(() => {
    // Set loading title in brand voice
    if (loading) {
      document.title = "0xHunter | Tracking..."
    }
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Target className="w-8 h-8 text-white animate-pulse mx-auto mb-4" />
          <p className="text-gray-300 font-serif italic">0xHunter is tracking...</p>
        </div>
      </div>
    )
  }

  if (!searchData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Target className="w-8 h-8 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 font-serif italic mb-4">The digital mists are too thick.<br />Even 0xHunter cannot pierce this veil.</p>
          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-800 text-white hover:bg-gray-700 font-serif"
          >
            Return to the Hunt
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
            <h1 className="text-xl sm:text-2xl font-mono tracking-wide text-white drop-shadow-lg">0xHunter</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white font-serif text-sm"
            onClick={handleCopyLink}
          >
            {linkCopied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Share
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-8">
          {/* Query Display - Prominent Page Title */}
          <div className="border-b border-gray-800/50 pb-6">
            <p className="text-gray-500 font-serif text-xs uppercase tracking-wider mb-3">Query</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-white leading-tight tracking-tight break-words">
              {searchData.query}
            </h1>
          </div>

          {/* Error/Low Confidence Display */}
          {searchData.error && (
            <div className="bg-red-950/30 rounded-lg p-4 border border-red-800/50">
              <p className="text-red-300 font-serif italic text-sm">
                {searchData.message || "0xHunter cannot track this target..."}
              </p>
            </div>
          )}

          {/* AI Response Display */}
          {searchData.response && (
            <div className="bg-gray-950/60 rounded-lg p-6 border border-gray-800/50">
              <p className="text-gray-400 font-serif text-sm mb-3">0xHunter's Report:</p>
              <div className="text-gray-200 font-serif text-base leading-relaxed prose prose-invert prose-headings:text-white prose-strong:text-white prose-ul:text-gray-200 prose-li:text-gray-200 max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    li: ({ children }) => <li className="text-gray-200">{children}</li>,
                  }}
                >
                  {searchData.response}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Results Display */}
          {searchData.results && searchData.results.length > 0 && (
            <div>
              <p className="text-gray-500 font-serif text-xs uppercase tracking-wider mb-4">Results</p>
              <ResultRenderer type={searchData.type} results={searchData.results} />
            </div>
          )}

          {/* Raw JSON Accordion (collapsed by default) */}
          <RawJsonAccordion data={searchData} />

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

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <Target className="w-8 h-8 text-white animate-pulse mx-auto mb-4" />
            <p className="text-gray-300 font-serif">0xHunter is tracking...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
