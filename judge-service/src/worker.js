import { Worker } from "bullmq";
import connection from "./config/redis.js";
import connectDB from "./config/db.js";
import { judge } from "./judge/judgeEngine.js";

// Connect to MongoDB
connectDB();

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "2", 10);

console.log(`[JudgeWorker] Starting submission worker with concurrency: ${CONCURRENCY}`);

const worker = new Worker(
    "submission-queue",
    async (job) => {
        const { submissionId } = job.data;
        if (!submissionId) {
            console.warn(`[JudgeWorker] Job ${job.id} has no submissionId`);
            return;
        }

        console.log(`[JudgeWorker] Processing job ${job.id} -> Submission ID: ${submissionId}`);
        await judge(submissionId);
    },
    {
        connection,
        concurrency: CONCURRENCY,
    }
);

worker.on("ready", () => {
    console.log("[JudgeWorker] Worker connected to Redis and ready to process submissions");
});

worker.on("completed", (job) => {
    console.log(`[JudgeWorker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
    console.error(`[JudgeWorker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
    if (err.code === "ECONNREFUSED") {
        // Suppress repeated stacktraces when Redis is offline
    } else {
        console.error("[JudgeWorker] Worker error:", err.message);
    }
});

export default worker;