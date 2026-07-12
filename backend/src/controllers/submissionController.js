import submissionModel from "../models/submission.js";
import problemModel from "../models/problem.js";

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