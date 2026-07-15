import { Worker } from "bullmq";
import connection from "./config/redis.js";
import connectDB from "./config/db.js";
import submissionModel from "./models/submissionModel.js";
import problemModel from "./models/problemModel.js";
const worker = new Worker(
    "submission-queue",
    async (job) => {
        const submission = await submissionModel.findById(job.data.submissionId);

        const problem = await problemModel.findById(submission.problemId);

        console.log(problem.storagePath);
        console.log(submission.sourceCode);
        console.log(submission.language);
    },
    { connection }
);