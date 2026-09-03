import userModel from "../models/user.js";
import problemModel from "../models/problem.js";
import submissionModel from "../models/submission.js";

export async function getStats(req, res, next) {
    try {
        const [
            totalUsers,
            adminCount,
            totalProblems,
            publishedProblems,
            totalSubmissions,
            problemsByCategory,
            problemsByDifficulty,
            submissionsByStatus,
            submissionsByLanguage,
            recentSubmissions,
        ] = await Promise.all([
            userModel.countDocuments(),
            userModel.countDocuments({ role: "admin" }),
            problemModel.countDocuments(),
            problemModel.countDocuments({ isPublished: true }),
            submissionModel.countDocuments(),
            problemModel.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            problemModel.aggregate([
                { $group: { _id: "$difficulty", count: { $sum: 1 } } },
            ]),
            submissionModel.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            submissionModel.aggregate([
                { $group: { _id: "$language", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            submissionModel.find()
                .populate("userId", "username email")
                .populate("problemId", "title slug difficulty")
                .sort({ createdAt: -1 })
                .limit(10),
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    admins: adminCount,
                    regularUsers: totalUsers - adminCount,
                },
                problems: {
                    total: totalProblems,
                    published: publishedProblems,
                    unpublished: totalProblems - publishedProblems,
                    byCategory: problemsByCategory.map((c) => ({
                        category: c._id || "Uncategorized",
                        count: c.count,
                    })),
                    byDifficulty: problemsByDifficulty.map((d) => ({
                        difficulty: d._id,
                        count: d.count,
                    })),
                },
                submissions: {
                    total: totalSubmissions,
                    byStatus: submissionsByStatus.map((s) => ({
                        status: s._id,
                        count: s.count,
                    })),
                    byLanguage: submissionsByLanguage.map((l) => ({
                        language: l._id,
                        count: l.count,
                    })),
                    recent: recentSubmissions,
                },
            },
        });
    } catch (error) {
        next(error);
    }
}
