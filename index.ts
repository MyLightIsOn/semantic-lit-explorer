import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import {RecursiveCharacterTextSplitter} from '@langchain/textsplitters';

const testPdfPath = "papers/VectorDB/1-s2.0-S1389041724000093-main.pdf"

async function main() {
    try {
        const loader = new PDFLoader(testPdfPath)
        const splitter = new RecursiveCharacterTextSplitter({chunkSize: 500, chunkOverlap: 50});

        const docs = await loader.load()
        const output = await splitter.splitDocuments(docs);
        console.log(output);
    } catch (e) {
        console.error(e)
    }
}

main();

