import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

async function init() {
    const pdfFilePath = "./nodejs.pdf";
    const loader = new PDFLoader(pdfFilePath);

    // Page by page load the PDF file
    const docs = await loader.load();

    // Ready the client OpenAI Embedding Model
    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
    });

    const vectorStore = await QdrantVectorStore.fromDocuments(
        docs,
        embeddings,
        {
            url: process.env.QDRANT_URL,
            api_key: process.env.QDRANT_API_KEY,
            collectionName: "chaicode-collection",
        }
    );

    console.log("Indexing of documents done...");
}

init();
