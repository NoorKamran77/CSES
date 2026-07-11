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

        statement: {
            type: String,
            required: true,
        },

        inputFormat: {
            type: String,
            required: true,
        },

        outputFormat: {
            type: String,
            required: true,
        },

        constraints: {
            type: String,
            default: "",
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
            type: Number, // milliseconds
            required: true,
            default: 1000,
        },

        memoryLimit: {
            type: Number, // MB
            required: true,
            default: 256,
        },

        checkerType: {
            type: String,
            enum: ["exact", "floating"],
            default: "exact",
        },

        storagePath: {
            type: String,
            required: true,
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
            ref: "User",
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

problemSchema.index({ slug: 1 });
problemSchema.index({ difficulty: 1 });
problemSchema.index({ tags: 1 });

export default mongoose.model("Problem", problemSchema);