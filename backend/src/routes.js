import { Router } from "express";
import { uploadFiles } from "./controller.js";

const router = Router();

router.get("/upload", uploadFiles);

router.get("/test", (req, res) => {
    res.send("Test route working successfully!");
});

export default router;
