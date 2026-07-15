import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoute.js";
import problemRouter from "./routes/problemRoute.js";
import submission from "./models/submission.js";
import submissionRouter from "./routes/submissionRoute.js";
import submissionQueue from "./queue/submissionQueue.js"
const app = express();
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
app.use("/submit", submissionRouter)
export default app;