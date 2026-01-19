'use server'

import { ChatOpenAI } from '@langchain/openai'
import { loadPdfFromBuffer } from '@/lib/pdf/loader'

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
 * Result type for PDF summary operation
 */
export type SummarizePdfResult = {
  success: boolean
  summary?: string
  fileName?: string
  pageCount?: number
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

    // Combine text from all pages (limit to first ~8000 chars for summarization)
    const fullText = docs.map(doc => doc.pageContent).join('\n\n')
    const textToSummarize = fullText.slice(0, 8000)

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

    // Extract token usage from response (handle different response formats)
    const usage = (response as any).usage_metadata || (response as any).response_metadata?.tokenUsage
    const promptTokens = usage?.input_tokens || usage?.promptTokens || 0
    const completionTokens = usage?.output_tokens || usage?.completionTokens || 0
    const totalTokens = promptTokens + completionTokens

    // Calculate cost (GPT-4o-mini pricing: $0.15/1M input, $0.60/1M output)
    const inputCost = (promptTokens / 1_000_000) * 0.15
    const outputCost = (completionTokens / 1_000_000) * 0.60
    const estimatedCost = inputCost + outputCost

    const endTime = performance.now()

    return {
      success: true,
      summary,
      fileName: file.name,
      pageCount: docs.length,
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
