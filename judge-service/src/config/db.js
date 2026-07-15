import mongoose from "mongoose";

async function connectDB() {
    try {
        const mongoUri = process.env.MONGO_URI;
        const dbName = process.env.DATABASE_NAME;

        if (!mongoUri) {
            console.warn("MONGO_URI is not set. Skipping database connection.");
            return;
        }

        await mongoose.connect(mongoUri, {
            dbName: dbName,
        });
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

export default connectDB;