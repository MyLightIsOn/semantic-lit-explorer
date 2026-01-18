import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"

const testPdfPath = "papers/VectorDB/1-s2.0-S1389041724000093-main.pdf"

async function main() {
    try {
        const loader = new PDFLoader(testPdfPath)

        const docs = await loader.load()
        console.log(docs[0]);
    } catch (e) {
        console.error(e)
    }
}

main();

