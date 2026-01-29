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
  project: string | null
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

    // Use RPC to execute a proper GROUP BY query
    // This returns only unique documents (11 rows) instead of all chunks (1912 rows)
    const { data, error } = await supabase.rpc('get_unique_documents')

    if (error) {
      // If RPC fails, try raw SQL query instead
      console.warn('RPC get_unique_documents failed, falling back to raw query:', error)

      const { data: rawData, error: rawError } = await supabase
        .from('documents')
        .select('source_file, document_title, authors, publication_year, doi, upload_date, project')
        .order('upload_date', { ascending: false })
        .limit(1000) // Explicitly set a high limit to get all documents

      if (rawError) {
        throw new Error(`Database query failed: ${rawError.message}`)
      }

      if (!rawData) {
        return { success: true, documents: [] }
      }

      // Group by source_file to get unique documents
      const documentMap = new Map<string, DocumentRecord>()

      rawData.forEach((row: any) => {
        const sourceFile = row.source_file || 'unknown'
        if (!documentMap.has(sourceFile)) {
          documentMap.set(sourceFile, {
            document_title: row.document_title,
            authors: row.authors,
            publication_year: row.publication_year,
            doi: row.doi,
            source_file: row.source_file,
            upload_date: row.upload_date,
            chunk_count: 0, // Will need to count separately
            project: row.project,
          })
        }
      })

      // Get chunk counts for each document
      for (const doc of documentMap.values()) {
        const { count } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('source_file', doc.source_file!)

        doc.chunk_count = count || 0
      }

      const documents = Array.from(documentMap.values()).sort((a, b) => {
        const dateA = a.upload_date ? new Date(a.upload_date).getTime() : 0
        const dateB = b.upload_date ? new Date(b.upload_date).getTime() : 0
        return dateB - dateA
      })

      return { success: true, documents }
    }

    if (!data) {
      return { success: true, documents: [] }
    }

    // Map RPC results to DocumentRecord format
    const documents: DocumentRecord[] = data.map((row: any) => ({
      document_title: row.document_title,
      authors: row.authors,
      publication_year: row.publication_year,
      doi: row.doi,
      source_file: row.source_file,
      upload_date: row.upload_date,
      chunk_count: row.chunk_count,
      project: row.project,
    }))

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

export type GetProjectsResult = {
  success: boolean
  projects?: string[]
  error?: string
}

/**
 * Server Action: Get list of unique project names from the database
 *
 * @returns List of unique project names
 */
export async function getProjects(): Promise<GetProjectsResult> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('documents')
      .select('project')
      .not('project', 'is', null)

    if (error) {
      throw new Error(`Database query failed: ${error.message}`)
    }

    // Get unique project names
    const projectSet = new Set<string>()
    data?.forEach((row: any) => {
      if (row.project) projectSet.add(row.project)
    })

    const projects = Array.from(projectSet).sort()

    return { success: true, projects }
  } catch (error) {
    console.error('Error in getProjects:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
