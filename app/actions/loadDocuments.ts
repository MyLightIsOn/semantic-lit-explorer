'use server'

import { loadPdfFromPath, loadPdfFromBuffer } from '@/lib/pdf/loader'
import { splitDocuments } from '@/lib/pdf/splitter'
import { storeDocuments } from '@/lib/vectordb/store'

/**
 * Result type for document loading operation
 */
export type LoadDocumentsResult = {
  success: boolean
  chunksLoaded?: number
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
  try {
    // Step 1: Load PDF
    const docs = await loadPdfFromPath(filePath)

    // Step 2: Split into chunks
    const chunks = await splitDocuments(docs)

    // Step 3 & 4: Generate embeddings and store
    const chunksLoaded = await storeDocuments(chunks, tableName)

    return {
      success: true,
      chunksLoaded,
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
 * @param tableName - Supabase table name (default: "documents")
 * @returns Result with success status and chunks loaded
 */
export async function loadDocumentsFromBuffer(
  buffer: Buffer,
  fileName: string,
  tableName: string = 'documents'
): Promise<LoadDocumentsResult> {
  try {
    // Step 1: Load PDF from buffer
    const docs = await loadPdfFromBuffer(buffer, fileName)

    // Step 2: Split into chunks
    const chunks = await splitDocuments(docs)

    // Step 3 & 4: Generate embeddings and store
    const chunksLoaded = await storeDocuments(chunks, tableName)

    return {
      success: true,
      chunksLoaded,
    }
  } catch (error) {
    console.error('Error loading documents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
