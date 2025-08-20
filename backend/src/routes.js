import { Router } from "express";
import { queryChat, uploadFiles } from "./controller.js";
import { validFileUploads } from "./utils.js";

const router = Router();

router.post("/upload", validFileUploads, uploadFiles);

router.post("/chat", queryChat);

export default router;
