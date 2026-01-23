'use server'

import { getSupabaseClient } from '@/lib/vectordb/supabase'

export type DocumentRecord = {
  document_title: string | null
  authors: string[] | null
  publication_year: number | null
  doi: string | null
  source_file: string | null
  upload_date: string | null
  chunk_count: number
}

export type GetDocumentsResult = {
  success: boolean
  documents?: DocumentRecord[]
  error?: string
}

/**
 * Server Action: Get list of all documents in the database
 *
 * Fetches unique documents by grouping chunks and counting them
 *
 * @returns List of documents with metadata
 */
export async function getDocuments(): Promise<GetDocumentsResult> {
  try {
    const supabase = getSupabaseClient()

    // Query to get unique documents and count their chunks
    // Group by source_file since that's unique per document
    const { data, error } = await supabase.from('documents').select('*')

    if (error) {
      throw new Error(`Database query failed: ${error.message}`)
    }

    if (!data) {
      return { success: true, documents: [] }
    }

    // Group by source_file to get unique documents
    const documentMap = new Map<string, DocumentRecord>()

    data.forEach((row: any) => {
      const sourceFile = row.source_file || 'unknown'

      if (documentMap.has(sourceFile)) {
        // Increment chunk count
        const doc = documentMap.get(sourceFile)!
        doc.chunk_count += 1
      } else {
        // New document
        documentMap.set(sourceFile, {
          document_title: row.document_title,
          authors: row.authors,
          publication_year: row.publication_year,
          doi: row.doi,
          source_file: row.source_file,
          upload_date: row.upload_date,
          chunk_count: 1,
        })
      }
    })

    // Convert map to array and sort by upload date (newest first)
    const documents = Array.from(documentMap.values()).sort((a, b) => {
      const dateA = a.upload_date ? new Date(a.upload_date).getTime() : 0
      const dateB = b.upload_date ? new Date(b.upload_date).getTime() : 0
      return dateB - dateA
    })

    return {
      success: true,
      documents,
    }
  } catch (error) {
    console.error('Error in getDocuments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
