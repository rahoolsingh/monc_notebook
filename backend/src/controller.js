import "dotenv/config";
import OpenAI from "openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

const client = new OpenAI();

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

export const queryChat = async (req, res) => {
    const userMessage = req.body.message;

    const openai = new OpenAI();

    try {
        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large",
        });

        const vectorStore = await QdrantVectorStore.fromExistingCollection(
            embeddings,
            {
                url: "http://localhost:6333",
                collectionName: "chaicode-collection",
            }
        );

        const vectorSearcher = vectorStore.asRetriever({
            k: 3,
        });

        const relevantChunk = await vectorSearcher.invoke(userMessage);

        const SYSTEM_PROMPT = `
            You are an intelligent AI assistant designed to answer user queries strictly based on the provided PDF context. 
            The context contains extracted content and page numbers from the document.

            ### Instructions:
            1. Use ONLY the information available in the provided context (\`relevantChunk\`).
            2. Do NOT invent, assume, or hallucinate any information not explicitly mentioned in the context.
            3. If the answer cannot be found in the context, respond with: 
            "The provided context does not contain sufficient information to answer this question."
            4. If a related concept is mentioned in the context, include it in the response.
            5. Whenever possible, include examples and page numbers from the context to support your answer.

            ### Response Structure:
            - **Introduction** → Briefly introduce the topic or concept.
            - **Key Points** → List important details, explanations, and insights from the context.
            - **Conclusion** → Provide a concise summary of the answer.
            - **Sources** → Mention the page numbers and references from the context.

            ### Context:
            ${JSON.stringify(relevantChunk)}
        `;

        const response = await client.chat.completions.create({
            model: "gpt-4.1",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage },
            ],
        });

        res.status(200).json({
            success: true,
            message: "Chat query processed successfully!",
            data: {
                response: response.choices[0].message.content,
            },
        });
    } catch (error) {
        console.error("Error querying chat:", error);
        res.status(500).json({
            success: false,
            message: "Error processing chat query.",
        });
    }
};
