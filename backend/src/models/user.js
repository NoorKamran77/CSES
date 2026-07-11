import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique: true,
    },
    email: {
        type: email,
        require: true,
        unique: true,
    },
    password: {
        type: String,
        require: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
        require: true
    },
    solvedProblems: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Problem",
            },
        ],
        default: [],
    },
}, { timestamps: true });

export default userSchema;