import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoute.js";
import problemRouter from "./routes/problemRoute.js";
import submissionRouter from "./routes/submissionRoute.js";
import adminRouter from "./routes/adminRoute.js";
import submissionQueue from "./queue/submissionQueue.js";
import connection from "./config/redis.js";


const app = express();

// Enable trust proxy for Render load balancers & secure cookies
app.set("trust proxy", 1);

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((o) => o.trim())
    : true;

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
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
app.use("/admin", adminRouter);

// Judge worker status — checks Redis heartbeat set by local judge-service
app.get("/judge/status", async (req, res) => {
    try {
        const val = await connection.get("judge:heartbeat");
        if (!val) {
            return res.json({ online: false });
        }
        const lastBeat = parseInt(val, 10);
        const ageMs = Date.now() - lastBeat;
        // Consider online if heartbeat was within the last 30 seconds
        const online = ageMs < 30_000;
        return res.json({ online, lastSeenMs: ageMs });
    } catch {
        return res.json({ online: false });
    }
});


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
