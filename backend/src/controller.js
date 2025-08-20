import "dotenv/config";
import OpenAI from "openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { UserService } from "./services/userService.js";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { PlaywrightWebBaseLoader } from "@langchain/community/document_loaders/web/playwright";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import fs from "fs";

const client = new OpenAI();

// Utility function to chunk large content
const chunkLargeContent = async (docs, maxChunkSize = 4000) => {
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: maxChunkSize,
        chunkOverlap: 200,
        separators: ["\n\n", "\n", ". ", " ", ""],
    });

    const chunkedDocs = [];

    for (const doc of docs) {
        if (doc.pageContent.length > maxChunkSize) {
            console.log(
                `Chunking large content: ${doc.pageContent.length} characters`
            );
            const chunks = await textSplitter.splitText(doc.pageContent);

            chunks.forEach((chunk, index) => {
                chunkedDocs.push({
                    pageContent: chunk,
                    metadata: {
                        ...doc.metadata,
                        chunkIndex: index,
                        totalChunks: chunks.length,
                        originalLength: doc.pageContent.length,
                    },
                });
            });
        } else {
            chunkedDocs.push(doc);
        }
    }

    console.log(
        `Content chunking: ${docs.length} documents -> ${chunkedDocs.length} chunks`
    );
    return chunkedDocs;
};

export const uploadFiles = async (req, res) => {
    try {
        const userId = req.body.userId || req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        const filename = req.file.filename;
        const filePath = req.file.path;
        const fileType = req.file.mimetype;
        const originalName = req.file.originalname;
        const fileSize = req.file.size;

        console.log(
            `Processing file: ${originalName} (${fileSize} bytes) for user: ${userId}`
        );

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(400).json({
                success: false,
                message: "Uploaded file not found",
            });
        }

        // User-specific Qdrant collection
        const collectionName = `user-${userId}-collection`;

        // Common embeddings
        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large",
        });

        let docs = [];

        if (fileType === "application/pdf") {
            const loader = new PDFLoader(filePath);
            const rawDocs = await loader.load();
            console.log(`PDF loaded with ${rawDocs.length} pages`);

            // Chunk large PDF content
            docs = await chunkLargeContent(rawDocs, 4000);
        } else if (
            fileType === "text/csv" ||
            fileType === "application/csv" ||
            fileType === "application/vnd.ms-excel"
        ) {
            const loader = new CSVLoader(filePath, {
                separator: ",",
                column: undefined, // Load all columns
            });
            docs = await loader.load();
            console.log(`CSV loaded with ${docs.length} rows`);

            // For CSV, we don't need to chunk as each row is already a separate document
        } else if (fileType === "text/plain") {
            // Handle plain text files
            const content = fs.readFileSync(filePath, "utf-8");
            const rawDocs = [
                {
                    pageContent: content,
                    metadata: {
                        source: originalName,
                        type: "text",
                    },
                },
            ];
            console.log(`Text file loaded with ${content.length} characters`);

            // Chunk large text files
            docs = await chunkLargeContent(rawDocs, 4000);
        } else {
            console.log(`Unsupported file type: ${fileType}`);
            return res.status(400).json({
                success: false,
                message: `Unsupported file type: ${fileType}. Supported types: PDF, CSV, TXT`,
            });
        }

        // Batch insertion into Qdrant
        const BATCH_SIZE = 500; // Tune this based on memory and Qdrant limit
        console.log(
            `Indexing ${docs.length} documents in batches of ${BATCH_SIZE}...`
        );

        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
            const batch = docs.slice(i, i + BATCH_SIZE);

            console.log(
                `Uploading batch ${
                    Math.floor(i / BATCH_SIZE) + 1
                } of ${Math.ceil(docs.length / BATCH_SIZE)}...`
            );

            await QdrantVectorStore.fromDocuments(batch, embeddings, {
                url: process.env.QDRANT_URL,
                api_key: process.env.QDRANT_API_KEY,
                collectionName,
            });
        }

        // Save file info in MongoDB
        const fileData = {
            id: filename.split("_")[1]?.split(".")[0] || filename.split(".")[0],
            originalName,
            filename,
            filePath,
            fileType,
            collectionName,
            fileSize,
            processedPages: docs.length,
        };

        await UserService.addFileToUser(userId, fileData);

        console.log(`Successfully processed and stored file: ${originalName}`);

        res.status(200).json({
            success: true,
            message: "File uploaded and indexed successfully!",
            data: {
                filename,
                originalName,
                fileId: fileData.id,
                fileSize,
                processedPages: docs.length,
            },
        });
    } catch (error) {
        console.error("Error uploading file:", error);

        // Clean up uploaded file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log("Cleaned up uploaded file after error");
            } catch (cleanupError) {
                console.error("Error cleaning up file:", cleanupError);
            }
        }

        // Handle specific error types
        let errorMessage = "Error uploading file";
        let statusCode = 500;

        if (error.message.includes("ECONNREFUSED")) {
            errorMessage =
                "Vector database connection failed. Please ensure Qdrant is running.";
            statusCode = 503;
        } else if (error.message.includes("Invalid API key")) {
            errorMessage = "OpenAI API key is invalid or missing.";
            statusCode = 401;
        } else if (error.message.includes("File too large")) {
            errorMessage = "File is too large. Maximum size is 10MB.";
            statusCode = 413;
        } else if (error.message.includes("No content")) {
            errorMessage =
                "Could not extract content from the file. Please ensure it's a valid PDF.";
            statusCode = 400;
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: error.message,
        });
    }
};

export const queryChat = async (req, res) => {
    try {
        const { message: userMessage, userId, chatHistory = [] } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        // Get user files from MongoDB
        const userFiles = await UserService.getUserFiles(userId);

        if (!userFiles || userFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "No documents found for this user. Please upload a document first.",
            });
        }

        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large",
        });

        // Use user-specific collection name
        const collectionName = userFiles[0].collectionName;

        const vectorStore = await QdrantVectorStore.fromExistingCollection(
            embeddings,
            {
                url: "http://localhost:6333",
                collectionName: collectionName,
            }
        );

        const vectorSearcher = vectorStore.asRetriever({
            k: 3,
        });

        const relevantChunk = await vectorSearcher.invoke(userMessage);

        const SYSTEM_PROMPT = `
You are an intelligent AI assistant designed to answer user queries strictly based on the provided context. 
The context contains extracted content from documents.

### Instructions:
1. Use ONLY the information available in the provided context.
2. If the exact answer is NOT available, look for **similar or related topics** in the context and provide the closest possible relevant information.
3. Do NOT invent, assume, or hallucinate details beyond what is provided.
4. If nothing even remotely related exists in the context, respond with:  
   "The provided context does not contain sufficient information to answer this question."
5. If a related concept is mentioned in the context, **explain it in detail** to help the user.
6. Whenever possible, include **examples**, **quotes**, and **references** from the context to support your answer.
7. Consider the **conversation history** to provide contextual and coherent responses.
8. Format your response using **Markdown** for better readability.

### Response Formatting Guidelines:
- Use **bold** for important terms and concepts.
- Use *italics* for emphasis.
- Use bullet points (-) or numbered lists (1.) for multiple items.
- Use \`code\` formatting for technical terms, file names, or specific values.
- Use > blockquotes for direct quotes from the context.
- Use ### headings to organize sections of your response.
- Use tables when presenting structured data.

### Response Structure:
Use this markdown structure for your responses:

## Summary
Brief overview of the answer.

## Key Points
- **Point 1**: Detailed explanation.
- **Point 2**: Additional information.
- **Point 3**: Supporting details.

## Related Information *(if exact answer not found)*
Provide insights on related concepts from the context.

## Details
Comprehensive explanation with examples, quotes, and references.

## Sources
List relevant page numbers or references from the context.

### Context:
${JSON.stringify(relevantChunk)}
`;

        // Limit chat history to prevent token overflow
        const maxHistoryMessages = 10;
        const limitedHistory = chatHistory.slice(-maxHistoryMessages);

        // Build conversation messages including limited history
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...limitedHistory.map((msg) => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content:
                    msg.content.length > 1000
                        ? msg.content.substring(0, 1000) + "..."
                        : msg.content,
            })),
            { role: "user", content: userMessage },
        ];

        let response;
        try {
            response = await client.chat.completions.create({
                model: "gpt-4.1-mini",
                messages: messages,
                max_tokens: 1000, // Limit response length
            });
        } catch (openaiError) {
            console.error("OpenAI API error:", openaiError);

            if (openaiError.message.includes("maximum context length")) {
                // Further reduce context if still too large
                const reducedContext =
                    limitedContext.substring(0, 3000) +
                    "... [context truncated due to size]";
                const reducedPrompt = SYSTEM_PROMPT.replace(
                    limitedContext,
                    reducedContext
                );

                const reducedMessages = [
                    { role: "system", content: reducedPrompt },
                    { role: "user", content: userMessage },
                ];

                response = await client.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: reducedMessages,
                    max_tokens: 1000,
                });
            } else {
                throw openaiError;
            }
        }

        const assistantResponse = response.choices[0].message.content;

        // Save chat messages to MongoDB
        await UserService.addChatMessage(userId, "user", userMessage);
        await UserService.addChatMessage(
            userId,
            "assistant",
            assistantResponse
        );

        // Get updated chat history
        const updatedSession = await UserService.getUserSession(userId);

        res.status(200).json({
            success: true,
            message: "Chat query processed successfully!",
            data: {
                response: assistantResponse,
                chatHistory: updatedSession.chatHistory,
            },
        });
    } catch (error) {
        console.error("Error querying chat:", error);
        res.status(500).json({
            success: false,
            message: "Error processing chat query.",
            error: error.message,
        });
    }
};

export const getUserSession = async (req, res) => {
    try {
        const userId = req.params.userId || req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const sessionData = await UserService.getUserSession(userId);

        res.status(200).json({
            success: true,
            data: sessionData,
        });
    } catch (error) {
        console.error("Error getting user session:", error);
        res.status(500).json({
            success: false,
            message: "Error getting user session",
            error: error.message,
        });
    }
};
export const clearChatHistory = async (req, res) => {
    try {
        const userId = req.params.userId || req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        await UserService.clearChatHistory(userId);

        res.status(200).json({
            success: true,
            message: "Chat history cleared successfully",
        });
    } catch (error) {
        console.error("Error clearing chat history:", error);
        res.status(500).json({
            success: false,
            message: "Error clearing chat history",
            error: error.message,
        });
    }
};

export const deleteUserSession = async (req, res) => {
    try {
        const userId = req.params.userId || req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        await UserService.deleteUser(userId);

        res.status(200).json({
            success: true,
            message: "User session deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting user session:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting user session",
            error: error.message,
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await UserService.getAllUsers();

        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error("Error getting all users:", error);
        res.status(500).json({
            success: false,
            message: "Error getting all users",
            error: error.message,
        });
    }
};
export const uploadUrl = async (req, res) => {
    try {
        const { userId, url, type } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        if (!url) {
            return res.status(400).json({
                success: false,
                message: "URL is required",
            });
        }

        console.log(
            `Processing URL: ${url} (type: ${type}) for user: ${userId}`
        );

        // User-specific Qdrant collection
        const collectionName = `user-${userId}-collection`;

        // Common embeddings
        const embeddings = new OpenAIEmbeddings({
            model: "text-embedding-3-large",
        });

        let docs = [];
        let sourceType = type || "webpage";

        try {
            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                // Handle YouTube URLs
                console.log("Processing YouTube video...");
                const loader = YoutubeLoader.createFromUrl(url, {
                    language: "en",
                    addVideoInfo: true,
                });
                docs = await loader.load();
                sourceType = "youtube";
                console.log(
                    `YouTube video loaded with ${docs.length} transcript segments`
                );
            } else {
                // Handle web pages
                console.log("Processing web page...");
                const loader = new PlaywrightWebBaseLoader(url, {
                    launchOptions: {
                        headless: true,
                    },
                    gotoOptions: {
                        waitUntil: "domcontentloaded",
                        timeout: 30000,
                    },
                    async evaluate(page) {
                        // Extract main content and clean up
                        const result = await page.evaluate(() => {
                            // Remove script and style elements
                            const scripts = document.querySelectorAll(
                                "script, style, nav, header, footer, aside"
                            );
                            scripts.forEach((el) => el.remove());

                            // Try to find main content area
                            const mainContent =
                                document.querySelector(
                                    "main, article, .content, .post, .entry"
                                ) || document.querySelector("body");

                            return mainContent
                                ? mainContent.innerText
                                : document.body.innerText;
                        });

                        // Limit content length to prevent token overflow
                        const maxLength = 50000; // Reasonable limit for web content
                        return result.length > maxLength
                            ? result.substring(0, maxLength) + "..."
                            : result;
                    },
                });

                const rawDocs = await loader.load();
                sourceType = "webpage";
                console.log(`Web page loaded with ${rawDocs.length} documents`);

                // Chunk large web page content
                docs = await chunkLargeContent(rawDocs, 3000);
            }

            if (!docs || docs.length === 0) {
                throw new Error("No content could be extracted from the URL");
            }

            // Batch insertion into Qdrant
            const BATCH_SIZE = 500;
            console.log(
                `Indexing ${docs.length} documents in batches of ${BATCH_SIZE}...`
            );

            for (let i = 0; i < docs.length; i += BATCH_SIZE) {
                const batch = docs.slice(i, i + BATCH_SIZE);

                console.log(
                    `Uploading batch ${
                        Math.floor(i / BATCH_SIZE) + 1
                    } of ${Math.ceil(docs.length / BATCH_SIZE)}...`
                );

                await QdrantVectorStore.fromDocuments(batch, embeddings, {
                    url: process.env.QDRANT_URL,
                    api_key: process.env.QDRANT_API_KEY,
                    collectionName,
                });
            }

            // Save URL info in MongoDB
            const urlData = {
                id: `url_${Date.now()}`,
                originalName:
                    sourceType === "youtube"
                        ? `YouTube: ${docs[0]?.metadata?.title || url}`
                        : `Web: ${new URL(url).hostname}`,
                filename: `${sourceType}_${Date.now()}.url`,
                filePath: url,
                fileType: `url/${sourceType}`,
                fileSize: JSON.stringify(docs).length,
                collectionName,
                processedPages: docs.length,
                sourceUrl: url,
            };

            await UserService.addFileToUser(userId, urlData);

            console.log(`Successfully processed and stored URL: ${url}`);

            res.status(200).json({
                success: true,
                message: `${
                    sourceType === "youtube" ? "YouTube video" : "Web page"
                } processed successfully!`,
                data: {
                    url,
                    originalName: urlData.originalName,
                    fileId: urlData.id,
                    sourceType,
                    processedSegments: docs.length,
                },
            });
        } catch (urlError) {
            console.error(`Error processing ${sourceType}:`, urlError);

            let errorMessage = `Failed to process ${sourceType}`;
            if (urlError.message.includes("timeout")) {
                errorMessage = `Timeout while loading ${sourceType}. Please try again.`;
            } else if (
                urlError.message.includes("not found") ||
                urlError.message.includes("404")
            ) {
                errorMessage = `${
                    sourceType === "youtube" ? "YouTube video" : "Web page"
                } not found or not accessible.`;
            } else if (
                urlError.message.includes("private") ||
                urlError.message.includes("restricted")
            ) {
                errorMessage = `${
                    sourceType === "youtube" ? "YouTube video" : "Web page"
                } is private or restricted.`;
            }

            return res.status(400).json({
                success: false,
                message: errorMessage,
                error: urlError.message,
            });
        }
    } catch (error) {
        console.error("Error processing URL:", error);

        // Handle specific error types
        let errorMessage = "Error processing URL";
        let statusCode = 500;

        if (error.message.includes("ECONNREFUSED")) {
            errorMessage =
                "Vector database connection failed. Please ensure Qdrant is running.";
            statusCode = 503;
        } else if (error.message.includes("Invalid API key")) {
            errorMessage = "OpenAI API key is invalid or missing.";
            statusCode = 401;
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: error.message,
        });
    }
};
