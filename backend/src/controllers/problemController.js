import * as ProblemService from "../services/problemService.js";

export async function create(req, res, next) {
    try {
        const problem = await ProblemService.create(req.body, req.user);

        return res.status(201).json({
            success: true,
            problem,
        });
    } catch (error) {
        next(error);
    }
}
export async function fetch(req, res, next) {
    try {
        const problems = await ProblemService.fetch();

        return res.status(200).json({
            success: true,
            count: problems.length,
            problems,
        });
    } catch (error) {
        next(error);
    }
}
export async function getBySlug(req, res, next) {
    try {
        const { slug } = req.params;

        const problem = await ProblemService.getBySlug(slug);

        return res.status(200).json({
            success: true,
            problem,
        });
    } catch (error) {
        next(error);
    }
}