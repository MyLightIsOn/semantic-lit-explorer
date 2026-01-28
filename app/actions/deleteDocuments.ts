'use server'

import { getSupabaseClient } from '@/lib/vectordb/supabase'

/**
 * Result type for document deletion operation
 */
export type DeleteDocumentsResult = {
  success: boolean
  deletedCount?: number
  error?: string
}

/**
 * Server Action: Delete documents from the vector database
 *
 * Deletes all chunks for the specified source files from the documents table.
 * This is a permanent operation and cannot be undone.
 *
 * @param sourceFiles - Array of source file names to delete
 * @returns Result with success status and count of deleted chunks
 */
export async function deleteDocuments(
  sourceFiles: string[]
): Promise<DeleteDocumentsResult> {
  try {
    if (!sourceFiles || sourceFiles.length === 0) {
      return {
        success: false,
        error: 'No documents specified for deletion',
      }
    }

    const supabase = getSupabaseClient()

    // Delete all chunks where source_file matches any in the array
    const { error, count } = await supabase
      .from('documents')
      .delete({ count: 'exact' })
      .in('source_file', sourceFiles)

    if (error) {
      throw new Error(`Database deletion failed: ${error.message}`)
    }

    return {
      success: true,
      deletedCount: count ?? 0,
    }
  } catch (error) {
    console.error('Error in deleteDocuments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
