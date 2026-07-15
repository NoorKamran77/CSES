import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userModel",
        required: true,
    },
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "problemModel",
        required: true,
    },
    language: {
        type: String,
        enum: ["cpp", "python", "java", "javascript"],
        required: true,
    },
    sourceCode: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: "Pending",
    },
    executionTime: Number,
    memoryUsed: Number,
    compilerOutput: String,
    errorMessage: String,
}, {
    timestamps: true,
});

export default mongoose.model("Submissions", submissionSchema);