/**
 * Semantic Literature Explorer - PDF to Vector Database Pipeline
 *
 * This script demonstrates the core RAG (Retrieval-Augmented Generation) workflow:
 * 1. Load PDF documents
 * 2. Split into semantic chunks
 * 3. Generate embeddings
 * 4. Store in vector database for semantic search
 */

// Load environment variables from .env file (must be first import)
import 'dotenv/config';

// LangChain document loaders and text processing
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

// Supabase vector database client and LangChain integration
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';

// OpenAI embeddings model (converts text to vectors)
import { OpenAIEmbeddings } from '@langchain/openai';

// Path to test PDF - replace with your own paper
const testPdfPath = "papers/VectorDB/1-s2.0-S1389041724000093-main.pdf"

async function main() {
    try {
        // STEP 1: Load PDF document
        // PDFLoader extracts text from PDF files
        const loader = new PDFLoader(testPdfPath)

        // STEP 2: Configure text splitter
        // RecursiveCharacterTextSplitter breaks documents into chunks for embedding
        // - chunkSize: 500 characters per chunk (balance between context and precision)
        // - chunkOverlap: 50 characters overlap between chunks (preserves context at boundaries)
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 50
        });

        // Load the PDF into LangChain Document objects
        const docs = await loader.load()

        // Split documents into chunks
        const output = await splitter.splitDocuments(docs);

        // STEP 3: Load environment variables for API access
        const sbApiKey = process.env.SUPABASE_API_KEY;
        const sbURL = process.env.SUPABASE_DB_URL;
        const openAIApieKey = process.env.OPENAI_API_KEY;

        // Verify all required environment variables are present
        if (!sbURL || !sbApiKey || !openAIApieKey) {
            throw new Error(`Missing environment variables: ${!sbURL ? 'SUPABASE_DB_URL ' : ''}${!sbApiKey ? 'SUPABASE_API_KEY ' : ''}${!openAIApieKey ? 'OPENAI_API_KEY' : ''}`);
        }

        // STEP 4: Initialize Supabase client
        // This connects to your Supabase vector database
        const supabase = createClient(sbURL, sbApiKey);

        // STEP 5: Generate embeddings and store in vector database
        // This does three things:
        // 1. Calls OpenAI API to convert each chunk to a vector embedding
        // 2. Stores the embedding + original text in Supabase
        // 3. Makes the data searchable by semantic similarity
        await SupabaseVectorStore.fromDocuments(
            output,                                           // Chunks to embed
            new OpenAIEmbeddings({openAIApiKey: openAIApieKey}), // Embedding model
            {client: supabase, tableName: "documents"}       // Storage config
        )

        console.log(`Successfully loaded ${output.length} chunks into vector database`);

    } catch (e) {
        console.error('Error loading documents:', e)
    }
}

// Run the pipeline
main();

