'use server'

import { loadPdfFromPath, loadPdfFromBuffer } from '@/lib/pdf/loader'
import { splitDocuments } from '@/lib/pdf/splitter'
import { storeDocuments } from '@/lib/vectordb/store'
import type { DocumentMetadata } from './summarizePdf'

/**
 * Metadata for document loading operation
 */
export type LoadingMetadata = {
  latencyMs: number
  pages: number
  chunks: number
  embeddingsGenerated: number
  estimatedTokens: number
  estimatedCost: number
}

/**
 * Result type for document loading operation
 */
export type LoadDocumentsResult = {
  success: boolean
  chunksLoaded?: number
  metadata?: LoadingMetadata
  error?: string
}

/**
 * Server Action: Load PDF from file path into vector database
 *
 * This is the main pipeline for converting PDFs to searchable vectors:
 * 1. Load PDF and extract text
 * 2. Split into semantic chunks
 * 3. Generate embeddings
 * 4. Store in Supabase vector database
 *
 * @param filePath - Path to PDF file on server
 * @param tableName - Supabase table name (default: "documents")
 * @returns Result with success status and chunks loaded
 */
export async function loadDocumentsFromPath(
  filePath: string,
  tableName: string = 'documents'
): Promise<LoadDocumentsResult> {
  const startTime = performance.now()

  try {
    // Step 1: Load PDF
    const docs = await loadPdfFromPath(filePath)

    // Step 2: Split into chunks
    const chunks = await splitDocuments(docs)

    // Step 3 & 4: Generate embeddings and store
    const chunksLoaded = await storeDocuments(chunks, tableName)

    // Calculate metadata
    const totalChars = chunks.reduce((sum, chunk) => sum + chunk.pageContent.length, 0)
    const estimatedTokens = Math.ceil(totalChars / 4) // Rough estimate: 1 token ~= 4 chars
    const estimatedCost = (estimatedTokens / 1_000_000) * 0.02 // text-embedding-3-small pricing

    const endTime = performance.now()

    return {
      success: true,
      chunksLoaded,
      metadata: {
        latencyMs: Math.round(endTime - startTime),
        pages: docs.length,
        chunks: chunks.length,
        embeddingsGenerated: chunks.length,
        estimatedTokens,
        estimatedCost,
      },
    }
  } catch (error) {
    console.error('Error loading documents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Server Action: Load PDF from uploaded file buffer into vector database
 *
 * Use this for user-uploaded PDFs (FormData)
 *
 * @param buffer - PDF file buffer
 * @param fileName - Original file name
 * @param documentMetadata - Extracted document metadata (title, authors, etc.)
 * @param tableName - Supabase table name (default: "documents")
 * @returns Result with success status and chunks loaded
 */
export async function loadDocumentsFromBuffer(
  buffer: Buffer,
  fileName: string,
  documentMetadata: DocumentMetadata,
  tableName: string = 'documents'
): Promise<LoadDocumentsResult> {
  const startTime = performance.now()

  try {
    // Step 1: Load PDF from buffer
    const docs = await loadPdfFromBuffer(buffer, fileName)

    // Step 2: Split into chunks
    const chunks = await splitDocuments(docs)

    // Step 3: Add document metadata to each chunk
    chunks.forEach((chunk) => {
      chunk.metadata = {
        ...chunk.metadata,
        document_title: documentMetadata.title,
        authors: documentMetadata.authors,
        publication_year: documentMetadata.publicationYear,
        doi: documentMetadata.doi,
        source_file: documentMetadata.sourceFile,
        upload_date: new Date().toISOString(),
      }
    })

    // Step 4 & 5: Generate embeddings and store
    const chunksLoaded = await storeDocuments(chunks, tableName)

    // Calculate metadata
    const totalChars = chunks.reduce((sum, chunk) => sum + chunk.pageContent.length, 0)
    const estimatedTokens = Math.ceil(totalChars / 4) // Rough estimate: 1 token ~= 4 chars
    const estimatedCost = (estimatedTokens / 1_000_000) * 0.02 // text-embedding-3-small pricing

    const endTime = performance.now()

    return {
      success: true,
      chunksLoaded,
      metadata: {
        latencyMs: Math.round(endTime - startTime),
        pages: docs.length,
        chunks: chunks.length,
        embeddingsGenerated: chunks.length,
        estimatedTokens,
        estimatedCost,
      },
    }
  } catch (error) {
    console.error('Error loading documents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
