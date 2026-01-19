import 'dotenv/config';
import {ChatOpenAI} from '@langchain/openai';
import { PromptTemplate} from '@langchain/core/prompts';

import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { StringOutputParser } from '@langchain/core/output_parsers';


const openAIApiKey = process.env.OPENAI_API_KEY;
const embeddings = new OpenAIEmbeddings({openAIApiKey})
const sbApiKey = process.env.SUPABASE_API_KEY
const sbUrl = process.env.SUPABASE_DB_URL
const supabase = createClient(sbUrl, sbApiKey)

const vectorStore = new SupabaseVectorStore(embeddings, {client: supabase, tableName: "documents", queryName: "match_documents"})

const retrievedDocs = vectorStore.asRetriever()

const llm = new ChatOpenAI({openAIApiKey})

const standaloneQuestionTemplate = "Create a standalone question form this user prompt: {question} standalone question:"

const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

const testPrompt = "I am trying to do research on how vectors and embeddings work, but I am not sure exactly how to phrase the question I am looking as this is my first exploration into this topic."

const chain = standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser()).pipe(retrievedDocs)

async function main() {
    const response = await chain.invoke({question: testPrompt});
    console.log(response);
}

main();
