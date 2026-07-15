import Redis from "ioredis";

const connection = new Redis({
    host: "127.0.0.1",
    port: 6379
});

connection.on("connect", () => {
    console.log("Redis Connected");
});

connection.on("error", (err) => {
    console.log(err);
});

export default connection;