import submissionModel from "../models/submission.js";
import problemModel from "../models/problem.js";
import mongoose from "mongoose";
export async function submit(req, res) {
    try {
        const { slug } = req.params;

        const problem = await problemModel.findOne({ slug });

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }
        const user = req.user;
        const { language, sourceCode } = req.body;

        const submission = await submissionModel.create({
            userId: user._id,
            problemId: problem._id,
            language,
            sourceCode,
            status: "Pending"
        });

        return res.status(201).json({
            success: true,
            data: submission,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}
export async function getAll(req, res) {
    try {
        const submissions = await submissionModel
            .find()
            .populate("userId", "username email")
            .populate("problemId", "title slug");

        return res.status(200).json({
            success: true,
            data: submissions
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
export async function getById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid submission ID",
            });
        }

        const submission = await submissionModel.findById(id);

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: "Submission not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: submission,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}