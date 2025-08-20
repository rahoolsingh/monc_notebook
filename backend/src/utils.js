import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const validMimeTypes = [
    "application/pdf",
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/json",
    "application/xml",
    "text/html",
    "text/markdown",
];

// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Multer storage config to save with original extension
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.body.userId || req.headers['x-user-id'];
        const userDir = `uploads/${userId}/`;
        
        // Create user directory if it doesn't exist
        import('fs').then(fs => {
            if (!fs.existsSync(userDir)) {
                fs.mkdirSync(userDir, { recursive: true });
            }
            cb(null, userDir);
        });
    },
    filename: (req, file, cb) => {
        try {
            const ext = path.extname(file.originalname) || "";
            const timestamp = Date.now();
            cb(null, `${timestamp}_${uuidv4()}${ext}`);
        } catch (err) {
            cb(err);
        }
    },
});

// File filter to check mime type and size
const fileFilter = (req, file, cb) => {
    try {
        // Check file type
        if (!validMimeTypes.includes(file.mimetype)) {
            cb(new Error(`Invalid file type: ${file.mimetype}. Supported types: PDF, DOCX, TXT, MD`), false);
            return;
        }
        
        // Check file size (this is a preliminary check, multer will also enforce limits)
        if (file.size && file.size > MAX_FILE_SIZE) {
            cb(new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`), false);
            return;
        }
        
        cb(null, true);
    } catch (err) {
        cb(err, false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 5 // Maximum 5 files at once
    }
});

// Middleware to upload file and apply validation with error handling
export const validFileUploads = (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (err) {
            return res
                .status(400)
                .json({ error: err.message || "File upload error" });
        }
        next();
    });
};
