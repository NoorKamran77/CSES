import mongoose from "mongoose";

async function connectDB() {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            console.warn("MONGODB_URI or MONGO_URI is not set. Skipping database connection.");
            return;
        }

        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

export default connectDB;