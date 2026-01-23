import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import type { Document } from '@langchain/core/documents'
import { getSupabaseClient } from './supabase'
import { getEmbeddings } from './embeddings'

/**
 * Load documents into Supabase vector database
 *
 * This function:
 * 1. Generates embeddings for each document using OpenAI
 * 2. Stores embeddings + original text + metadata in Supabase
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
  const embeddingsModel = getEmbeddings()

  // Generate embeddings for all documents
  const texts = documents.map((doc) => doc.pageContent)
  const embeddings = await embeddingsModel.embedDocuments(texts)

  // Prepare records for insertion
  const records = documents.map((doc, idx) => ({
    content: doc.pageContent,
    metadata: doc.metadata,
    embedding: embeddings[idx],
    // Map document metadata to table columns
    document_title: doc.metadata.document_title || null,
    authors: doc.metadata.authors || null,
    publication_year: doc.metadata.publication_year || null,
    doi: doc.metadata.doi || null,
    source_file: doc.metadata.source_file || null,
    upload_date: doc.metadata.upload_date || new Date().toISOString(),
  }))

  // Insert into Supabase
  const { error } = await supabase.from(tableName).insert(records)

  if (error) {
    throw new Error(`Failed to store documents: ${error.message}`)
  }

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
