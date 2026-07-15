import { Queue } from "bullmq";
import connection from "../config/redis.js";

const submissionQueue = new Queue(
    "submission-queue",
    {
        connection,
    }
);

export default submissionQueue;