import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const connection = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    maxRetriesPerRequest: null,
    lazyConnect: true,
});

connection.on("connect", () => {
    console.log("Redis Connected");
});

connection.on("error", (err) => {
    // Log friendly warning if connection fails
    if (err.code === "ECONNREFUSED") {
        // Suppress repeated connection refused stacktraces
    } else {
        console.error("Redis Error:", err.message);
    }
});

export default connection;