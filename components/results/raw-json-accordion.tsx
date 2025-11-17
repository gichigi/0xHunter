"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RawJsonAccordionProps {
  data: any
}

export function RawJsonAccordion({ data }: RawJsonAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return (
    <div className="bg-gray-950/60 rounded-lg border border-gray-800/50 overflow-hidden">
      {/* Accordion Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-gray-400 font-serif text-sm">Raw Output</span>
          <span className="text-gray-500 font-mono text-xs">(for developers)</span>
        </div>
        {isExpanded && (
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleCopy()
            }}
            variant="outline"
            size="sm"
            className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy JSON
              </>
            )}
          </Button>
        )}
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="border-t border-gray-800/50">
          <div className="p-4">
            <pre className="text-gray-100 font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto bg-gray-900/50 p-4 rounded max-h-96 overflow-y-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
