import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { getRetriever } from '@/lib/vectordb/retriever';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';

// Get retriever from shared library
const retrievedDocs = getRetriever()

// Initialize LLM
const openAIApiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({ openAIApiKey })

const standaloneQuestionTemplate = "Create a standalone question form this user prompt: {question} standalone question:"

const answerTemplate = "You are a research assistant. You will answer questions from the user given the context provided. If you do not know the answer or it is not available in the information provided, please provide a detailed explanation of why you cannot answer the question and recommend to the user what they should do instead. DO NOT try to make up an answer. Question: {question} Context: {context}"

const answerPrompt = PromptTemplate.fromTemplate(answerTemplate)
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate)

const testPrompt = "I am trying to do research on how vectors and embeddings work, but I am not sure exactly how to phrase the question I am looking as this is my first exploration into this topic."


const standaloneQuestionChain = standaloneQuestionPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())

const retrieverChain = RunnableSequence.from([
    prevResult => prevResult.standalone_question,
    retrievedDocs,
    combineDocuments
])

const answerChain = answerPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())

function combineDocuments(docs: any[]) {
    return docs.map(doc => doc.pageContent).join('\n\n')
}

const chain = RunnableSequence.from([
    {
        standalone_question: standaloneQuestionChain,
        original_input: new RunnablePassthrough()
    }, {
        context: retrieverChain,
        question: ({ original_input }) => original_input.question
    },
    answerChain
])

async function main() {
    const response = await chain.invoke({question: testPrompt});
    console.log(response);
}

main();
