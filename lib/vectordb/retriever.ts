import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'
import { Document } from '@langchain/core/documents'
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
 * @param filter - Optional metadata filter (e.g., { source_file: { $in: ["file1.pdf", "file2.pdf"] } })
 * @returns VectorStoreRetriever configured for the vector database
 */
export function getRetriever(
  tableName: string = 'documents',
  queryName: string = 'match_documents',
  k: number = 4,
  filter?: Record<string, any>
): VectorStoreRetriever<SupabaseVectorStore> {
  const supabase = getSupabaseClient()
  const embeddings = getEmbeddings()

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName,
    queryName,
  })

  return vectorStore.asRetriever({
    k,
    filter,
  })
}

/**
 * Retrieve documents with source file and project filtering
 *
 * This directly calls the match_documents function with source_files and project parameters
 * for more efficient filtering than JSONB metadata queries.
 *
 * @param query - The query string to search for
 * @param sourceFiles - Optional array of source file names to filter by
 * @param project - Optional project name to filter by
 * @param k - Number of documents to retrieve (default: 4)
 * @returns Array of Document objects
 */
export async function retrieveDocuments(
  query: string,
  sourceFiles?: string[],
  project?: string,
  k: number = 4
): Promise<Document[]> {
  const supabase = getSupabaseClient()
  const embeddingsModel = getEmbeddings()

  // Generate embedding for the query
  const queryEmbedding = await embeddingsModel.embedQuery(query)

  // Call the match_documents function with source_files and project parameters
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    filter: {},
    match_count: k,
    source_files: sourceFiles || null,
    project: project || null,
  })

  if (error) {
    throw new Error(`Failed to retrieve documents: ${error.message}`)
  }

  if (!data) {
    return []
  }

  // Convert to LangChain Document format
  return data.map((row: any) => {
    return new Document({
      pageContent: row.content,
      metadata: row.metadata || {},
    })
  })
}
