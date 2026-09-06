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

export function getProblemStorageFullPath(slug) {
    const storagePath = path.posix.join("storage", "problems", slug);
    const baseDir = process.env.STORAGE_PATH
        ? path.resolve(process.env.STORAGE_PATH)
        : (process.cwd().endsWith("backend") || process.cwd().endsWith("judge-service")
            ? path.resolve(process.cwd(), "..", "storage")
            : path.join(process.cwd(), "storage"));
    return {
        storagePath,
        fullPath: path.join(baseDir, "problems", slug)
    };
}


export async function create(problemData, user) {
    const title = String(problemData.title || "").trim();
    const slug = sanitizeSlug(problemData.slug || title);

    if (!title) {
        throw new Error("Title is required");
    }

    const existingProblem = await problemModel.findOne({
        $or: [{ title }, { slug }],
    });

    if (existingProblem) {
        throw new Error("Problem with this title or slug already exists");
    }

    const { storagePath, fullPath } = getProblemStorageFullPath(slug);

    await fs.mkdir(path.join(fullPath, "samples"), { recursive: true });
    await fs.mkdir(path.join(fullPath, "hidden"), { recursive: true });

    const problem = await problemModel.create({
        title,
        slug,
        description: problemData.description || "",
        inputFormat: problemData.inputFormat || "",
        outputFormat: problemData.outputFormat || "",
        constraints: problemData.constraints || "",
        difficulty: problemData.difficulty || "Easy",
        tags: Array.isArray(problemData.tags) ? problemData.tags : [],
        timeLimit: Number(problemData.timeLimit) || 1000,
        memoryLimit: Number(problemData.memoryLimit) || 256,
        checkerType: problemData.checkerType || "exact",
        category: problemData.category ? String(problemData.category).trim() : "Introductory Problems",
        order: Number(problemData.order) || 0,
        storagePath,
        createdBy: user._id,
        isPublished: problemData.isPublished !== undefined ? Boolean(problemData.isPublished) : true,
    });

    return problem;
}

export async function fetch(filters = {}) {
    const query = {};
    if (filters.difficulty) {
        query.difficulty = filters.difficulty;
    }
    if (filters.category) {
        query.category = filters.category;
    }
    if (filters.isPublished !== undefined) {
        query.isPublished = filters.isPublished;
    }

    const problems = await problemModel.find(query)
        .populate("createdBy", "username email")
        .sort({ order: 1, createdAt: -1 });

    return problems;
}

export async function getGroupedByCategory(user = null) {
    const problems = await problemModel.find({ isPublished: true })
        .select("title slug difficulty category order tags timeLimit memoryLimit")
        .sort({ category: 1, order: 1, createdAt: 1 });

    const solvedSet = new Set(
        user?.solvedProblems ? user.solvedProblems.map((id) => id.toString()) : []
    );

    const groupedMap = new Map();

    for (const prob of problems) {
        const cat = prob.category || "Introductory Problems";
        if (!groupedMap.has(cat)) {
            groupedMap.set(cat, []);
        }

        groupedMap.get(cat).push({
            id: prob._id,
            title: prob.title,
            slug: prob.slug,
            difficulty: prob.difficulty,
            order: prob.order,
            tags: prob.tags,
            timeLimit: prob.timeLimit,
            memoryLimit: prob.memoryLimit,
            isSolved: solvedSet.has(prob._id.toString()),
        });
    }

    const result = [];
    for (const [category, problemList] of groupedMap.entries()) {
        const solvedCount = problemList.filter((p) => p.isSolved).length;
        result.push({
            category,
            totalCount: problemList.length,
            solvedCount,
            problems: problemList,
        });
    }

    return result;
}

export async function getBySlug(slug) {
    const problem = await problemModel.findOne({ slug })
        .populate("createdBy", "username email");

    if (!problem) {
        throw new Error("Problem not found");
    }

    return problem;
}

export async function update(slug, updateData) {
    const problem = await problemModel.findOne({ slug });
    if (!problem) {
        throw new Error("Problem not found");
    }

    const allowedFields = [
        "title",
        "description",
        "inputFormat",
        "outputFormat",
        "constraints",
        "difficulty",
        "category",
        "order",
        "tags",
        "timeLimit",
        "memoryLimit",
        "checkerType",
        "isPublished",
    ];

    allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
            problem[field] = updateData[field];
        }
    });

    await problem.save();
    return problem;
}


export async function deleteProblem(slug) {
    const problem = await problemModel.findOneAndDelete({ slug });
    if (!problem) {
        throw new Error("Problem not found");
    }

    const { fullPath } = getProblemStorageFullPath(slug);
    try {
        await fs.rm(fullPath, { recursive: true, force: true });
    } catch (err) {
        console.warn(`Could not delete storage folder for ${slug}:`, err.message);
    }

    return problem;
}

export async function getSamples(slug) {
    const problem = await problemModel.findOne({ slug });
    if (!problem) {
        throw new Error("Problem not found");
    }

    const { fullPath } = getProblemStorageFullPath(slug);
    const samplesDir = path.join(fullPath, "samples");

    try {
        const files = await fs.readdir(samplesDir);
        const inFiles = files.filter(f => f.endsWith(".in")).sort();

        const samples = [];
        for (const inFile of inFiles) {
            const base = inFile.replace(/\.in$/, "");
            const outFile = `${base}.out`;

            const inputContent = await fs.readFile(path.join(samplesDir, inFile), "utf-8");
            let outputContent = "";
            try {
                outputContent = await fs.readFile(path.join(samplesDir, outFile), "utf-8");
            } catch {
                // out file might not exist yet
            }

            samples.push({
                id: base,
                input: inputContent,
                output: outputContent
            });
        }

        return samples;
    } catch {
        return [];
    }
}

export async function saveTestcases(slug, type, testcases) {
    const problem = await problemModel.findOne({ slug });
    if (!problem) {
        throw new Error("Problem not found");
    }

    if (type !== "samples" && type !== "hidden") {
        throw new Error("Invalid testcase type. Must be 'samples' or 'hidden'");
    }

    if (!Array.isArray(testcases) || testcases.length === 0) {
        throw new Error("Testcases array is required and cannot be empty");
    }

    const { fullPath } = getProblemStorageFullPath(slug);
    const targetDir = path.join(fullPath, type);
    await fs.mkdir(targetDir, { recursive: true });

    let count = 0;
    for (let i = 0; i < testcases.length; i++) {
        const tc = testcases[i];
        const id = tc.id !== undefined ? String(tc.id) : String(i + 1);
        const input = String(tc.input ?? "");
        const output = String(tc.output ?? "");

        await fs.writeFile(path.join(targetDir, `${id}.in`), input, "utf-8");
        await fs.writeFile(path.join(targetDir, `${id}.out`), output, "utf-8");
        count++;
    }

    // Update count in problem document
    if (type === "samples") {
        problem.sampleTestcaseCount = count;
    } else {
        problem.hiddenTestcaseCount = count;
    }

    await problem.save();

    return {
        type,
        count,
        problem
    };
}
