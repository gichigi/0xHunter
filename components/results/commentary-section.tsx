"use client"

interface CommentarySectionProps {
  commentary: string
}

export function CommentarySection({ commentary }: CommentarySectionProps) {
  if (!commentary || commentary.trim().length === 0) {
    return null
  }

  return (
    <div className="bg-gray-950/60 rounded-lg p-4 border border-gray-800/50">
      <p className="text-gray-400 font-serif text-sm mb-2">Hunter's Commentary:</p>
      <div className="prose prose-invert max-w-none">
        <p className="text-gray-300 font-serif italic leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
          {commentary}
        </p>
      </div>
    </div>
  )
}
