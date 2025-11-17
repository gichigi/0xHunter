"use client"

interface TagsDisplayProps {
  tags: string[]
}

export function TagsDisplay({ tags }: TagsDisplayProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'whale':
        return 'bg-blue-900/50 text-blue-300 border-blue-700/50'
      case 'active':
        return 'bg-green-900/50 text-green-300 border-green-700/50'
      case 'heavy-trader':
        return 'bg-orange-900/50 text-orange-300 border-orange-700/50'
      case 'token-collector':
        return 'bg-purple-900/50 text-purple-300 border-purple-700/50'
      case 'diversified':
        return 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50'
      case 'inactive':
        return 'bg-gray-800/50 text-gray-400 border-gray-600/50'
      default:
        return 'bg-gray-800/50 text-gray-300 border-gray-600/50'
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className={`px-2 py-1 rounded-full text-xs font-mono border ${getTagColor(tag)}`}
        >
          {tag.toLowerCase()}
        </span>
      ))}
    </div>
  )
}
