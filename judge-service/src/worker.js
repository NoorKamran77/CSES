import { Worker } from "bullmq";
import connection from "./config/redis.js";
import connectDB from "./config/db.js";
import submissionModel from "./models/submissionModel.js";

const worker = new Worker(
    "submission-queue",
    async (job) => {
        const submission = await submissionModel.findById(job.data.submissionId);

        console.log(submission);
    },
    { connection }
);