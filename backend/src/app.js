import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoute.js";
import problemRouter from "./routes/problemRoute.js";
import submissionRouter from "./routes/submissionRoute.js";
import submissionQueue from "./queue/submissionQueue.js";

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/test", async (req, res) => {
    try {
        const job = await submissionQueue.add("hello", {
            message: "Hello Worker"
        });

        res.status(200).json({
            success: true,
            jobId: job.id,
            message: "Job added successfully"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

app.use("/auth", authRouter);
app.use("/problem", problemRouter);
app.use("/submit", submissionRouter);

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
    });
});

export default app;