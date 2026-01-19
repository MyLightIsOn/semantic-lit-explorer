import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import type { Document } from "@langchain/core/documents"

/**
 * Load PDF from file path and extract text into LangChain Documents
 *
 * @param filePath - Path to PDF file
 * @returns Array of Document objects with extracted text and metadata
 */
export async function loadPdfFromPath(filePath: string): Promise<Document[]> {
  const loader = new PDFLoader(filePath)
  return await loader.load()
}

/**
 * Load PDF from buffer (useful for uploaded files)
 *
 * @param buffer - PDF file buffer
 * @param fileName - Original file name for metadata
 * @returns Array of Document objects with extracted text and metadata
 */
export async function loadPdfFromBuffer(buffer: Buffer, fileName: string): Promise<Document[]> {
  // Create a blob from the buffer for PDFLoader
  const blob = new Blob([buffer], { type: 'application/pdf' })
  const loader = new PDFLoader(blob, { pdfjs: () => import('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js') })

  const docs = await loader.load()

  // Add file name to metadata
  docs.forEach(doc => {
    doc.metadata.source = fileName
  })

  return docs
}
