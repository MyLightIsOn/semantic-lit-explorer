/**
 * Text cleaning utilities for PDF metadata extraction
 */

/**
 * Clean and normalize a title extracted from PDF
 * Fixes common issues:
 * - Missing spaces between words
 * - ALL CAPS text
 * - Excessive line breaks and whitespace
 * - Multiple consecutive spaces
 */
export function cleanTitle(title: string): string {
  if (!title) return title

  let cleaned = title

  // Remove line breaks and replace with spaces
  cleaned = cleaned.replace(/\n+/g, ' ')

  // Add spaces before capital letters that follow lowercase letters (for missing spaces)
  // e.g., "GitContextController" stays, but "GITCONTEXTCONTROLLER" -> "GIT CONTEXT CONTROLLER"
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2')

  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\s+/g, ' ')

  // Trim
  cleaned = cleaned.trim()

  // If the title is ALL CAPS, convert to Title Case
  if (cleaned === cleaned.toUpperCase() && cleaned.length > 0) {
    cleaned = toTitleCase(cleaned)
  }

  return cleaned
}

/**
 * Convert a string to Title Case
 * Handles special cases like "LLM", "AI", etc.
 */
function toTitleCase(str: string): string {
  // Words that should stay uppercase
  const uppercaseWords = new Set(['LLM', 'AI', 'RAG', 'API', 'PDF', 'GPT', 'NLP', 'ML', 'DL', 'GIT'])

  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      // Check if word (uppercase) is in our special list
      const upperWord = word.toUpperCase()
      if (uppercaseWords.has(upperWord)) {
        return upperWord
      }

      // Check if word has special characters (like "LLM-based")
      if (word.includes('-')) {
        return word
          .split('-')
          .map((part) => {
            const upperPart = part.toUpperCase()
            if (uppercaseWords.has(upperPart)) {
              return upperPart
            }
            return part.charAt(0).toUpperCase() + part.slice(1)
          })
          .join('-')
      }

      // Standard title case: capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Clean author names
 * Removes extra whitespace and normalizes formatting
 */
export function cleanAuthors(authors: string[]): string[] {
  return authors
    .map((author) => author.replace(/\s+/g, ' ').trim())
    .filter((author) => author.length > 0)
}

/**
 * Extract DOI from text using regex patterns
 * Looks for common DOI formats:
 * - 10.xxxx/xxxxx
 * - doi:10.xxxx/xxxxx
 * - https://doi.org/10.xxxx/xxxxx
 */
export function extractDOI(text: string): string | null {
  // Common DOI patterns
  const doiPatterns = [
    // https://doi.org/10.xxxx/xxxxx
    /(?:https?:\/\/)?(?:dx\.)?doi\.org\/(10\.\d{4,}\/[^\s]+)/i,
    // doi:10.xxxx/xxxxx or DOI: 10.xxxx/xxxxx
    /doi:?\s*(10\.\d{4,}\/[^\s]+)/i,
    // Plain 10.xxxx/xxxxx (must be preceded by whitespace or start of string)
    /(?:^|\s)(10\.\d{4,}\/[^\s]+)/i,
  ]

  for (const pattern of doiPatterns) {
    const match = text.match(pattern)
    if (match) {
      // Extract just the DOI part (10.xxxx/xxxxx)
      const doi = match[1] || match[0]
      // Clean up any trailing punctuation
      return doi.replace(/[.,;)\]]+$/, '')
    }
  }

  return null
}
