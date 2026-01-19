import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'
import { getSupabaseClient } from './supabase'
import { getEmbeddings } from './embeddings'

/**
 * Get a retriever for querying the vector database
 *
 * This returns a retriever that can be used in LangChain chains
 * to fetch relevant documents based on semantic similarity.
 *
 * @param tableName - Name of Supabase table (default: "documents")
 * @param queryName - Name of the match function in Supabase (default: "match_documents")
 * @param k - Number of documents to retrieve (default: 4)
 * @returns VectorStoreRetriever configured for the vector database
 */
export function getRetriever(
  tableName: string = 'documents',
  queryName: string = 'match_documents',
  k: number = 4
): VectorStoreRetriever<SupabaseVectorStore> {
  const supabase = getSupabaseClient()
  const embeddings = getEmbeddings()

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName,
    queryName,
  })

  return vectorStore.asRetriever({ k })
}
