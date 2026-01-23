'use server'

import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { retrieveDocuments } from '@/lib/vectordb/retriever'

export type PipelineSteps = {
  reformulatedQuestion: string
  documentsRetrieved: number
  documentSnippets?: string[]
}

export type QueryMetadata = {
  totalLatencyMs: number
  reformulationLatency: number
  retrievalLatency: number
  answerLatency: number
  tokensUsed: {
    reformulation: {
      prompt: number
      completion: number
      total: number
    }
    answer: {
      prompt: number
      completion: number
      total: number
    }
    total: number
  }
  documentsRetrieved: number
  estimatedCost: number
}

export type QueryResult = {
  success: boolean
  answer?: string
  pipelineSteps?: PipelineSteps
  metadata?: QueryMetadata
  error?: string
}

export async function queryDocuments(
  question: string,
  selectedDocuments?: string[]
): Promise<QueryResult> {
  try {
    const overallStartTime = performance.now()

    // Initialize LLM
    const openAIApiKey = process.env.OPENAI_API_KEY
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    const llm = new ChatOpenAI({ openAIApiKey })

    // Step 1: Reformulate question
    const reformulationStartTime = performance.now()
    const standaloneQuestionTemplate =
      'Create a standalone question form this user prompt: {question} standalone question:'
    const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)
    const standaloneQuestionChain = standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser())

    const reformulatedQuestion = await standaloneQuestionChain.invoke({ question })
    const reformulationEndTime = performance.now()
    const reformulationLatency = reformulationEndTime - reformulationStartTime

    // Extract token usage for reformulation
    // Note: We need to get the raw response to access token usage
    const reformulationResponse = await standaloneQuestionPrompt.pipe(llm).invoke({ question })
    const reformulationUsage =
      (reformulationResponse as any).usage_metadata ||
      (reformulationResponse as any).response_metadata?.tokenUsage
    const reformulationPromptTokens = reformulationUsage?.input_tokens || reformulationUsage?.promptTokens || 0
    const reformulationCompletionTokens =
      reformulationUsage?.output_tokens || reformulationUsage?.completionTokens || 0

    // Step 2: Retrieve documents
    const retrievalStartTime = performance.now()
    // If specific documents are selected, filter by source_file
    const sourceFiles =
      selectedDocuments && selectedDocuments.length > 0 ? selectedDocuments : undefined

    console.log('[queryDocuments] Filtering by source files:', sourceFiles)
    const retrievedDocs = await retrieveDocuments(reformulatedQuestion, sourceFiles, 4)
    console.log('[queryDocuments] Retrieved docs:', retrievedDocs.map(d => ({
      source: d.metadata.source_file,
      preview: d.pageContent.substring(0, 100)
    })))

    const retrievalEndTime = performance.now()
    const retrievalLatency = retrievalEndTime - retrievalStartTime

    const documentsRetrieved = retrievedDocs.length
    const documentSnippets = retrievedDocs.map((doc) => {
      const source = doc.metadata.source_file || 'unknown'
      return `[${source}] ${doc.pageContent.substring(0, 150)}...`
    })

    // Combine documents for context
    const context = retrievedDocs.map((doc) => doc.pageContent).join('\n\n')

    // Step 3: Generate answer
    const answerStartTime = performance.now()
    const answerTemplate = `You are a research assistant helping analyze academic papers.

Answer the user's question using ONLY the context provided below. The context consists of relevant excerpts from research papers.

IMPORTANT:
- Base your answer entirely on the provided context
- Quote or reference specific parts of the context when possible
- If the context doesn't contain enough information to fully answer the question, say so clearly
- DO NOT make up information or use knowledge outside the provided context
- If multiple papers are mentioned in the context, clarify which paper each point comes from

Question: {question}

Context from research papers:
{context}

Answer:`
    const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)
    const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser())

    const answer = await answerChain.invoke({
      question: reformulatedQuestion,
      context,
    })
    const answerEndTime = performance.now()
    const answerLatency = answerEndTime - answerStartTime

    // Extract token usage for answer generation
    const answerResponse = await answerPrompt.pipe(llm).invoke({
      question: reformulatedQuestion,
      context,
    })
    const answerUsage =
      (answerResponse as any).usage_metadata || (answerResponse as any).response_metadata?.tokenUsage
    const answerPromptTokens = answerUsage?.input_tokens || answerUsage?.promptTokens || 0
    const answerCompletionTokens = answerUsage?.output_tokens || answerUsage?.completionTokens || 0

    // Calculate total metrics
    const totalLatencyMs = performance.now() - overallStartTime
    const totalTokens =
      reformulationPromptTokens +
      reformulationCompletionTokens +
      answerPromptTokens +
      answerCompletionTokens

    // Calculate cost (GPT-4o-mini: $0.15/1M input, $0.60/1M output)
    const reformulationCost =
      (reformulationPromptTokens / 1_000_000) * 0.15 + (reformulationCompletionTokens / 1_000_000) * 0.6
    const answerCost = (answerPromptTokens / 1_000_000) * 0.15 + (answerCompletionTokens / 1_000_000) * 0.6
    const estimatedCost = reformulationCost + answerCost

    const pipelineSteps: PipelineSteps = {
      reformulatedQuestion,
      documentsRetrieved,
      documentSnippets,
    }

    const metadata: QueryMetadata = {
      totalLatencyMs,
      reformulationLatency,
      retrievalLatency,
      answerLatency,
      tokensUsed: {
        reformulation: {
          prompt: reformulationPromptTokens,
          completion: reformulationCompletionTokens,
          total: reformulationPromptTokens + reformulationCompletionTokens,
        },
        answer: {
          prompt: answerPromptTokens,
          completion: answerCompletionTokens,
          total: answerPromptTokens + answerCompletionTokens,
        },
        total: totalTokens,
      },
      documentsRetrieved,
      estimatedCost,
    }

    return {
      success: true,
      answer,
      pipelineSteps,
      metadata,
    }
  } catch (error) {
    console.error('Error in queryDocuments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
