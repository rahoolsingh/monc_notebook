import express from "express";
import cors from "cors";
import router from "./src/routes.js";
import connectDB from "./src/config/database.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Enable CORS for frontend communication
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Adjust as needed
    credentials: true
}));

app.use(express.json()); // Middleware to parse JSON requests

app.use("/api", router);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
