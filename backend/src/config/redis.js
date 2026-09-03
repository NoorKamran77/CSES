import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUri = process.env.REDIS_URI || process.env.REDIS_URL;

let connection;
if (redisUri) {
    const isTls = redisUri.startsWith("rediss://");
    connection = new Redis(redisUri, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
        ...(isTls ? { tls: { rejectUnauthorized: false } } : {})
    });
} else {
    connection = new Redis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        password: process.env.REDIS_PASSWORD || undefined,
        username: process.env.REDIS_USERNAME || undefined,
        maxRetriesPerRequest: null,
        lazyConnect: true,
    });
}

connection.on("connect", () => {
    console.log("Redis Connected");
});

connection.on("error", (err) => {
    if (err.code === "ECONNREFUSED") {
        // Suppress repeated connection refused stacktraces when offline
    } else {
        console.error("Redis Error:", err.message);
    }
});

export default connection;
