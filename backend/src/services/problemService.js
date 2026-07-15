import fs from "fs/promises";
import path from "path";
import problemModel from "../models/problem.js";

function sanitizeSlug(slug) {
    const normalized = String(slug || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    if (!normalized) {
        throw new Error("Invalid slug");
    }

    return normalized;
}

export async function create(problemData, user) {
    const title = String(problemData.title || "").trim();
    const slug = sanitizeSlug(problemData.slug);

    if (!title) {
        throw new Error("Title is required");
    }

    const existingProblem = await problemModel.findOne({
        $or: [{ title }, { slug }],
    });

    if (existingProblem) {
        throw new Error("Problem already exists");
    }

    const storagePath = path.posix.join("storage", "problems", slug);
    const fullPath = path.resolve(
        process.cwd(),
        "..",
        storagePath
    );

    await fs.mkdir(path.join(fullPath, "samples"), { recursive: true });
    await fs.mkdir(path.join(fullPath, "hidden"), { recursive: true });

    const problem = await problemModel.create({
        title,
        slug,
        storagePath,
        createdBy: user._id,
    });

    return problem;
}

export async function fetch() {
    const problems = await problemModel.find()
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });

    return problems;
}
export async function getBySlug(slug) {
    const problem = await problemModel.findOne({ slug })
        .populate("createdBy", "username email");

    if (!problem) {
        throw new Error("Problem not found");
    }

    return problem;
}