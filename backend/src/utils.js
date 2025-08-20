import multer from "multer";
import path from "path";

const validMimeTypes = [
    "application/pdf",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/json",
    "application/xml",
    "text/html",
];

// Multer storage config to save with original extension
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        try {
            const ext = path.extname(file.originalname) || "";
            cb(null, `${Date.now()}-${file.fieldname}${ext}`);
        } catch (err) {
            cb(err);
        }
    },
});

// File filter to check mime type
const fileFilter = (req, file, cb) => {
    try {
        if (validMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type"), false);
        }
    } catch (err) {
        cb(err, false);
    }
};

const upload = multer({ storage, fileFilter });

// Middleware to upload file and apply validation with error handling
export const validFileUploads = (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message || "File upload error" });
        }
        next();
    });
};
