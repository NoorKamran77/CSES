import mongoose from "mongoose";

const problemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        storagePath: {
            type: String,
            required: true,
            trim: true,
        },

        difficulty: {
            type: String,
            enum: ["Easy", "Medium", "Hard"],
            default: "Easy",
        },

        tags: [
            {
                type: String,
                trim: true,
            },
        ],

        timeLimit: {
            type: Number,
            default: 1000,
        },

        memoryLimit: {
            type: Number,
            default: 256,
        },

        checkerType: {
            type: String,
            enum: ["exact", "floating"],
            default: "exact",
        },

        sampleTestcaseCount: {
            type: Number,
            default: 0,
        },

        hiddenTestcaseCount: {
            type: Number,
            default: 0,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userModel",
            required: true,
        },

        isPublished: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const problemModel = mongoose.model("Problems", problemSchema);

export default problemModel;