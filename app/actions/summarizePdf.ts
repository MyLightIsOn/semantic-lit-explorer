'use server'

import { ChatOpenAI } from '@langchain/openai'
import { loadPdfFromBuffer } from '@/lib/pdf/loader'
import { cleanTitle, cleanAuthors, extractDOI } from '@/lib/utils/textCleaning'

/**
 * Metadata for summarization operation
 */
export type SummarizationMetadata = {
  latencyMs: number
  tokensUsed: {
    prompt: number
    completion: number
    total: number
  }
  modelUsed: string
  estimatedCost: number
  charactersProcessed: number
}

/**
 * Document metadata extracted from PDF
 */
export type DocumentMetadata = {
  title: string
  authors: string[]
  publicationYear: number | null
  doi: string | null
  sourceFile: string
}

/**
 * Result type for PDF summary operation
 */
export type SummarizePdfResult = {
  success: boolean
  summary?: string
  fileName?: string
  pageCount?: number
  documentMetadata?: DocumentMetadata
  metadata?: SummarizationMetadata
  error?: string
}

/**
 * Server Action: Generate AI summary of uploaded PDF
 *
 * This extracts text from the PDF and uses an LLM to generate a summary.
 * The user can review the summary before deciding to load into the vector database.
 *
 * @param formData - FormData containing the uploaded PDF file
 * @returns Result with summary and metadata
 */
export async function summarizePdf(formData: FormData): Promise<SummarizePdfResult> {
  const startTime = performance.now()

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

    // Load PDF and extract text
    const docs = await loadPdfFromBuffer(buffer, file.name)

    if (docs.length === 0) {
      return {
        success: false,
        error: 'Could not extract text from PDF',
      }
    }

    // Combine text from all pages
    const fullText = docs.map((doc) => doc.pageContent).join('\n\n')
    const textToSummarize = fullText.slice(0, 8000)
    // Use more text for metadata extraction (first 2 pages typically have all metadata)
    const textForMetadata = fullText.slice(0, 16000)

    // Get OpenAI API key
    const openAIApiKey = process.env.OPENAI_API_KEY
    if (!openAIApiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      }
    }

    // Initialize LLM
    const modelName = 'gpt-4o-mini'
    const llm = new ChatOpenAI({
      openAIApiKey,
      modelName,
      temperature: 0.3,
    })

    // Generate summary
    const response = await llm.invoke([
      {
        role: 'system',
        content: `You are a research paper summarizer. Generate a concise summary of the following research paper. Include:
- Main topic and research question
- Key findings or contributions
- Methodology (briefly)
- Relevance to LLM systems, RAG, or AI architectures (if applicable)

Keep the summary to 3-5 sentences.`,
      },
      {
        role: 'user',
        content: textToSummarize,
      },
    ])

    const summary = response.content.toString()

    // Extract structured metadata
    const metadataResponse = await llm.invoke([
      {
        role: 'system',
        content: `You are a metadata extraction assistant. Extract the following information from this research paper and return ONLY valid JSON (no markdown, no code blocks):

{
  "title": "paper title",
  "authors": ["author1", "author2"],
  "publicationYear": 2024,
  "doi": "10.xxxx/xxxxx"
}

IMPORTANT for title formatting:
- The title in PDFs often has formatting issues (missing spaces, ALL CAPS, line breaks)
- Fix these issues and return a properly formatted, readable title
- Use proper capitalization (Title Case)
- Add spaces where missing (e.g., "GITCONTEXTCONTROLLER" → "Git Context Controller")
- Fix compound words that are run together (e.g., "Thecontext" → "The Context", "Ofllm" → "Of LLM")
- Keep acronyms uppercase (LLM, AI, RAG, API, etc.)

IMPORTANT for DOI extraction:
- Look for DOI in the header, footer, or citation information
- DOIs follow the pattern: 10.xxxx/xxxxx (e.g., 10.1145/3551349.3556968)
- May be prefixed with "doi:", "DOI:", or "https://doi.org/"
- Return ONLY the DOI number (10.xxxx/xxxxx format), not the full URL
- If no DOI found, return null

If you cannot find a field, use null for strings/numbers or [] for arrays.`,
      },
      {
        role: 'user',
        content: textForMetadata,
      },
    ])

    const metadataText = metadataResponse.content.toString()

    // Parse JSON (handle potential markdown code blocks)
    let extractedMetadata
    try {
      const jsonMatch = metadataText.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : metadataText
      extractedMetadata = JSON.parse(jsonStr)
    } catch (e) {
      // Fallback to defaults if parsing fails
      extractedMetadata = {
        title: file.name.replace('.pdf', ''),
        authors: [],
        publicationYear: null,
        doi: null,
      }
    }

    // If LLM didn't find DOI, try regex extraction as fallback
    let doi = extractedMetadata.doi || null
    if (!doi) {
      doi = extractDOI(fullText)
    }

    const documentMetadata: DocumentMetadata = {
      title: cleanTitle(extractedMetadata.title || file.name.replace('.pdf', '')),
      authors: cleanAuthors(
        Array.isArray(extractedMetadata.authors) ? extractedMetadata.authors : []
      ),
      publicationYear: extractedMetadata.publicationYear || null,
      doi,
      sourceFile: file.name,
    }

    // Extract token usage from both responses (handle different response formats)
    const summaryUsage = (response as any).usage_metadata || (response as any).response_metadata?.tokenUsage
    const summaryPromptTokens = summaryUsage?.input_tokens || summaryUsage?.promptTokens || 0
    const summaryCompletionTokens = summaryUsage?.output_tokens || summaryUsage?.completionTokens || 0

    const metadataUsage =
      (metadataResponse as any).usage_metadata || (metadataResponse as any).response_metadata?.tokenUsage
    const metadataPromptTokens = metadataUsage?.input_tokens || metadataUsage?.promptTokens || 0
    const metadataCompletionTokens = metadataUsage?.output_tokens || metadataUsage?.completionTokens || 0

    const promptTokens = summaryPromptTokens + metadataPromptTokens
    const completionTokens = summaryCompletionTokens + metadataCompletionTokens
    const totalTokens = promptTokens + completionTokens

    // Calculate cost (GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output)
    const inputCost = (promptTokens / 1_000_000) * 0.15
    const outputCost = (completionTokens / 1_000_000) * 0.6
    const estimatedCost = inputCost + outputCost

    const endTime = performance.now()

    return {
      success: true,
      summary,
      fileName: file.name,
      pageCount: docs.length,
      documentMetadata,
      metadata: {
        latencyMs: Math.round(endTime - startTime),
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: totalTokens,
        },
        modelUsed: modelName,
        estimatedCost,
        charactersProcessed: textToSummarize.length,
      },
    }
  } catch (error) {
    console.error('Error in summarizePdf:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
