import { Router } from "express";
import { uploadFiles } from "./controller.js";
import { validFileUploads } from "./utils.js";

const router = Router();

router.post("/upload", validFileUploads, uploadFiles);

export default router;
