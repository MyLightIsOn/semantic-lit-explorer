'use server'

import { loadDocumentsFromBuffer, type LoadDocumentsResult } from './loadDocuments'

/**
 * Server Action: Handle PDF upload from form and load into vector database
 *
 * This is the main entry point for user-uploaded PDFs via the UI.
 * It extracts the file from FormData, converts to Buffer, and processes it.
 *
 * @param formData - FormData containing the uploaded PDF file
 * @returns Result with success status and chunks loaded
 */
export async function uploadAndLoadDocument(formData: FormData): Promise<LoadDocumentsResult> {
  try {
    // Extract file from FormData
    const file = formData.get('pdf') as File

    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      }
    }

    // Validate it's a PDF
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return {
        success: false,
        error: 'File must be a PDF',
      }
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Use existing loadDocumentsFromBuffer function
    return await loadDocumentsFromBuffer(buffer, file.name)
  } catch (error) {
    console.error('Error in uploadAndLoadDocument:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
