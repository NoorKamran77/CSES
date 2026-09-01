import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
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
        enum: [
            "Pending",
            "Queued",
            "Compiling",
            "Running",
            "Accepted",
            "Wrong Answer",
            "Compilation Error",
            "Runtime Error",
            "Time Limit Exceeded",
            "Memory Limit Exceeded",
            "Internal Error",
        ],
        default: "Pending",
    },
    executionTime: {
        type: Number,
        default: 0,
    },
    memoryUsed: {
        type: Number,
        default: 0,
    },
    compilerOutput: {
        type: String,
        default: "",
    },
    errorMessage: {
        type: String,
        default: "",
    },
}, {
    timestamps: true,
});

const submissionModel = mongoose.models.Submission || mongoose.model("Submission", submissionSchema);
export default submissionModel;