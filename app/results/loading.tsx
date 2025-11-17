"use client"

import { Target, Loader2 } from "lucide-react"

export default function Loading() {
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
        </div>
      </header>

      {/* Loading Content */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center">
          <div className="mb-8">
            <Target className="w-16 h-16 text-white animate-pulse mx-auto mb-6 drop-shadow-lg" />
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <h2 className="text-2xl sm:text-3xl font-serif text-white drop-shadow-lg">The Hunter is tracking...</h2>
            </div>
            <p className="text-gray-400 font-serif text-base sm:text-lg italic leading-relaxed drop-shadow-sm max-w-2xl mx-auto">
              Piercing through the shadows of the blockchain, following the digital breadcrumbs left by every
              transaction...
            </p>
          </div>

          {/* Loading Animation */}
          <div className="bg-gray-950/40 rounded-lg p-8 border border-gray-700/50 backdrop-blur-sm shadow-xl shadow-black/50 max-w-md mx-auto">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                <span className="text-gray-400 font-serif text-sm">Analyzing wallet activity...</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-200"></div>
                <span className="text-gray-400 font-serif text-sm">Scanning token holdings...</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-400"></div>
                <span className="text-gray-400 font-serif text-sm">Decoding transaction patterns...</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
