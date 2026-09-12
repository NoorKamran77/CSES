import submissionModel from "../models/submission.js";
import problemModel from "../models/problem.js";
import mongoose from "mongoose";
import submissionQueue from "../queue/submissionQueue.js";
import connection from "../config/redis.js";

const SUPPORTED_LANGUAGES = ["cpp", "python", "java", "javascript"];

export async function submit(req, res, next) {
    try {
        const { slug } = req.params;
        const { language, sourceCode } = req.body;

        if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
            return res.status(400).json({
                success: false,
                message: `Unsupported language. Allowed: ${SUPPORTED_LANGUAGES.join(", ")}`
            });
        }

        if (!sourceCode || typeof sourceCode !== "string" || !sourceCode.trim()) {
            return res.status(400).json({
                success: false,
                message: "sourceCode is required and cannot be empty"
            });
        }

        const problem = await problemModel.findOne({ slug });
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: "Problem not found"
            });
        }

        // Check if judge worker is currently online via Redis heartbeat
        let isJudgeOnline = false;
        try {
            const heartbeat = await connection.get("judge:heartbeat");
            if (heartbeat) {
                const ageMs = Date.now() - parseInt(heartbeat, 10);
                isJudgeOnline = ageMs < 30_000;
            }
        } catch {
            isJudgeOnline = false;
        }

        const allowOfflineQueue = process.env.ALLOW_OFFLINE_QUEUE === "true";
        if (!isJudgeOnline && !allowOfflineQueue) {
            return res.status(503).json({
                success: false,
                message: "Judge worker is currently offline. Submissions cannot be processed right now. Please ensure the judge worker is running on your PC."
            });
        }

        const submission = await submissionModel.create({
            userId: req.user._id,
            problemId: problem._id,
            language,
            sourceCode,
            status: "Pending"
        });

        let jobId = null;
        try {
            const job = await submissionQueue.add("judge-submission", {
                submissionId: submission._id.toString(),
            });
            jobId = job?.id;
        } catch (queueErr) {
            console.warn("Queue notice: Redis is offline or unreachable. Submission created in MongoDB.", queueErr.message);
        }

        return res.status(201).json({
            success: true,
            message: "Submission queued successfully",
            submission: {
                id: submission._id,
                problemId: problem._id,
                slug: problem.slug,
                language: submission.language,
                status: submission.status,
                createdAt: submission.createdAt,
            },
            jobId: jobId || "offline-queued",
        });


    } catch (err) {
        next(err);
    }
}

export async function getAll(req, res, next) {
    try {
        const { problemId, slug, userId, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (problemId && mongoose.Types.ObjectId.isValid(problemId)) {
            query.problemId = problemId;
        } else if (slug) {
            const prob = await problemModel.findOne({ slug });
            if (prob) {
                query.problemId = prob._id;
            }
        }

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            query.userId = userId;
        }

        if (status) {
            query.status = status;
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [submissions, total] = await Promise.all([
            submissionModel
                .find(query)
                .populate("userId", "username email")
                .populate("problemId", "title slug difficulty")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            submissionModel.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            limit: limitNum,
            data: submissions
        });
    } catch (error) {
        next(error);
    }
}

export async function getById(req, res, next) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid submission ID",
            });
        }

        const submission = await submissionModel.findById(id)
            .populate("userId", "username email")
            .populate("problemId", "title slug difficulty timeLimit memoryLimit");

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
        next(error);
    }
}

export async function getMySubmissions(req, res, next) {
    try {
        const { slug, problemId, page = 1, limit = 20 } = req.query;
        const query = { userId: req.user._id };

        if (problemId && mongoose.Types.ObjectId.isValid(problemId)) {
            query.problemId = problemId;
        } else if (slug) {
            const prob = await problemModel.findOne({ slug });
            if (prob) {
                query.problemId = prob._id;
            }
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        const [submissions, total] = await Promise.all([
            submissionModel
                .find(query)
                .populate("problemId", "title slug difficulty")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            submissionModel.countDocuments(query)
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            limit: limitNum,
            data: submissions
        });
    } catch (error) {
        next(error);
    }
}
