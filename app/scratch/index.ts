import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { getRetriever } from '@/lib/vectordb/retriever';

// Get retriever from shared library
const retrievedDocs = getRetriever()

// Initialize LLM
const openAIApiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({ openAIApiKey })

const standaloneQuestionTemplate = "Create a standalone question form this user prompt: {question} standalone question:"

const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

const testPrompt = "I am trying to do research on how vectors and embeddings work, but I am not sure exactly how to phrase the question I am looking as this is my first exploration into this topic."

const chain = standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser()).pipe(retrievedDocs)

async function main() {
    const response = await chain.invoke({question: testPrompt});
    console.log(response);
}

main();
