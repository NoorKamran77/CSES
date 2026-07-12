import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userModel",
            required: true,
            index: true,
        },

        problemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "problemModel",
            required: true,
            index: true,
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
    },
    {
        timestamps: true,
    }
);

submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ problemId: 1, createdAt: -1 });

const submissionModel = new mongoose.model("submissionModel", submissionSchema);
export default submissionModel;