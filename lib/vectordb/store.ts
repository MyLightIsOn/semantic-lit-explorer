import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import type { Document } from "@langchain/core/documents"
import { getSupabaseClient } from './supabase'
import { getEmbeddings } from './embeddings'

/**
 * Load documents into Supabase vector database
 *
 * This function:
 * 1. Generates embeddings for each document using OpenAI
 * 2. Stores embeddings + original text in Supabase
 * 3. Makes documents searchable by semantic similarity
 *
 * @param documents - Array of Document chunks to store
 * @param tableName - Name of Supabase table (default: "documents")
 * @returns Number of documents stored
 */
export async function storeDocuments(
  documents: Document[],
  tableName: string = 'documents'
): Promise<number> {
  const supabase = getSupabaseClient()
  const embeddings = getEmbeddings()

  await SupabaseVectorStore.fromDocuments(documents, embeddings, {
    client: supabase,
    tableName,
  })

  return documents.length
}

/**
 * Get SupabaseVectorStore instance for querying
 *
 * @param tableName - Name of Supabase table (default: "documents")
 * @returns Configured SupabaseVectorStore for querying
 */
export async function getVectorStore(
  tableName: string = 'documents'
): Promise<SupabaseVectorStore> {
  const supabase = getSupabaseClient()
  const embeddings = getEmbeddings()

  return new SupabaseVectorStore(embeddings, {
    client: supabase,
    tableName,
  })
}
