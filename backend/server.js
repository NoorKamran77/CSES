import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import connection from "./src/config/redis.js";
dotenv.config();
connectDB();


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});