import * as ProblemService from "../services/problemService.js";

export async function create(req, res, next) {
    try {
        const problem = await ProblemService.create(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: "Problem created successfully",
            problem,
        });
    } catch (error) {
        next(error);
    }
}

export async function fetch(req, res, next) {
    try {
        const { difficulty, isPublished } = req.query;
        const filters = {};
        if (difficulty) filters.difficulty = difficulty;
        if (isPublished !== undefined) filters.isPublished = isPublished === "true";

        const problems = await ProblemService.fetch(filters);

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

export async function update(req, res, next) {
    try {
        const { slug } = req.params;
        const problem = await ProblemService.update(slug, req.body);

        return res.status(200).json({
            success: true,
            message: "Problem updated successfully",
            problem,
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteProblem(req, res, next) {
    try {
        const { slug } = req.params;
        const problem = await ProblemService.deleteProblem(slug);

        return res.status(200).json({
            success: true,
            message: "Problem deleted successfully",
            problem,
        });
    } catch (error) {
        next(error);
    }
}

export async function getSamples(req, res, next) {
    try {
        const { slug } = req.params;
        const samples = await ProblemService.getSamples(slug);

        return res.status(200).json({
            success: true,
            count: samples.length,
            samples,
        });
    } catch (error) {
        next(error);
    }
}

export async function saveTestcases(req, res, next) {
    try {
        const { slug } = req.params;
        const { type, testcases } = req.body;

        const result = await ProblemService.saveTestcases(slug, type, testcases);

        return res.status(200).json({
            success: true,
            message: `Saved ${result.count} ${type} testcases successfully`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
}