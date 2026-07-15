import { Worker } from "bullmq";
import connection from "./config/redis.js";

const worker = new Worker(

    "submission-queue",

    async (job) => {

        console.log(job.data);

    },

    { connection }

);