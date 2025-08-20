import { Router } from "express";
import { uploadFiles } from "./controller.js";
import { validFileUploads } from "./utils.js";


const router = Router();

router.post("/upload", validFileUploads, uploadFiles);

router.get("/test", (req, res) => {
    res.send("Test route working successfully!");
});

export default router;
