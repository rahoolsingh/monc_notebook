import "dotenv/config";
import OpenAI from "openai";
import { QdrantVectorStore } from "@langchain/qdrant";



export const uploadFiles = async (req, res) => {
    const filename = req.file.filename;

    res.status(200).json({
        success: true,
        message: "File uploaded successfully!",
        data: {
            filename,
        },
    });
};
