import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import type { Document } from "@langchain/core/documents"

/**
 * Text splitter configuration for academic papers
 *
 * - chunkSize: 500 characters per chunk (balance between context and precision)
 * - chunkOverlap: 50 characters overlap between chunks (preserves context at boundaries)
 */
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
})

/**
 * Split documents into semantic chunks for embedding
 *
 * @param docs - LangChain Documents to split
 * @returns Array of smaller Document chunks ready for embedding
 */
export async function splitDocuments(docs: Document[]): Promise<Document[]> {
  return await textSplitter.splitDocuments(docs)
}

/**
 * Get the configured text splitter instance
 * Useful if you need to customize splitting behavior
 */
export function getTextSplitter(): RecursiveCharacterTextSplitter {
  return textSplitter
}
