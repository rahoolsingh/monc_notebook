import { Router } from "express";
import { 
    queryChat, 
    uploadFiles, 
    uploadUrl,
    getUserSession, 
    clearChatHistory, 
    deleteUserSession, 
    getAllUsers 
} from "./controller.js";
import { validFileUploads } from "./utils.js";

const router = Router();

// File and chat operations
router.post("/upload", validFileUploads, uploadFiles);
router.post("/upload-url", uploadUrl);
router.post("/chat", queryChat);

// User session management
router.get("/session/:userId", getUserSession);
router.delete("/session/:userId/chat", clearChatHistory);
router.delete("/session/:userId", deleteUserSession);

// Admin endpoints
router.get("/users", getAllUsers);

export default router;
