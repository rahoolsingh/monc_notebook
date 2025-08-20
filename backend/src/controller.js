import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

export const uploadFiles = async (req, res) => {
    const filename = req.file.filename;
    const filePath = req.file.path;
    const fileType = req.file.mimetype;

    if (fileType === "application/pdf") {
        const loader = new PDFLoader(filePath);

        const docs = await loader.load();

        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large",
        });

        await QdrantVectorStore.fromDocuments(docs, embeddings, {
            url: "http://localhost:6333",
            collectionName: "chaicode-collection",
        });
    } else {
        console.log(`Unsupported file type: ${fileType}`);
    }

    res.status(200).json({
        success: true,
        message: "Vectorization and indexing done successfully!",
        data: {
            filename,
        },
    });
};
