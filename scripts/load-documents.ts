/**
 * CLI Script: Load PDF documents into vector database
 *
 * This is a standalone script for bulk loading PDFs outside of the Next.js web app.
 * Useful for:
 * - Batch processing multiple papers
 * - Manual data loading
 * - Testing the pipeline
 *
 * Usage:
 *   pnpm load
 *
 * Or with a custom PDF path:
 *   tsx scripts/load-documents.ts path/to/paper.pdf
 */

// Load environment variables (Next.js doesn't run for CLI scripts)
import 'dotenv/config'

import { loadPdfFromPath } from '@/lib/pdf/loader'
import { splitDocuments } from '@/lib/pdf/splitter'
import { storeDocuments } from '@/lib/vectordb/store'

// Default test PDF path - can be overridden by command line argument
const defaultPdfPath = 'papers/VectorDB/1-s2.0-S1389041724000093-main.pdf'

async function main() {
  try {
    // Get PDF path from command line or use default
    const pdfPath = process.argv[2] || defaultPdfPath

    console.log(`Loading PDF: ${pdfPath}`)
    console.log('---')

    // STEP 1: Load PDF document
    console.log('Step 1: Loading PDF...')
    const docs = await loadPdfFromPath(pdfPath)
    console.log(`✓ Loaded ${docs.length} pages`)

    // STEP 2: Split into chunks
    console.log('Step 2: Splitting into chunks...')
    const chunks = await splitDocuments(docs)
    console.log(`✓ Created ${chunks.length} chunks`)

    // STEP 3 & 4: Generate embeddings and store
    console.log('Step 3: Generating embeddings and storing in vector database...')
    const chunksLoaded = await storeDocuments(chunks)
    console.log(`✓ Successfully loaded ${chunksLoaded} chunks into vector database`)

    console.log('---')
    console.log('✅ Pipeline completed successfully!')
  } catch (error) {
    console.error('❌ Error loading documents:', error)
    process.exit(1)
  }
}

main()
