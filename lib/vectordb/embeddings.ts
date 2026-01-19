import { OpenAIEmbeddings } from '@langchain/openai'

/**
 * Get OpenAI embeddings instance
 *
 * Reads API key from environment variable:
 * - OPENAI_API_KEY
 *
 * @throws Error if environment variable is missing
 * @returns Configured OpenAI embeddings instance
 */
export function getEmbeddings(): OpenAIEmbeddings {
  const openAIApiKey = process.env.OPENAI_API_KEY

  if (!openAIApiKey) {
    throw new Error('Missing environment variable: OPENAI_API_KEY')
  }

  return new OpenAIEmbeddings({ openAIApiKey })
}
