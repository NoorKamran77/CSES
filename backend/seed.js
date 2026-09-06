import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcrypt";
import connectDB from "./src/config/db.js";
import userModel from "./src/models/user.js";
import problemModel from "./src/models/problem.js";

dotenv.config();

const PROBLEMS = [
    {
        title: "Weird Algorithm",
        slug: "weird-algorithm",
        category: "Introductory Problems",
        order: 1,
        difficulty: "Easy",
        timeLimit: 1000,
        memoryLimit: 256,
        checkerType: "exact",
        description:
            "Consider an algorithm that takes as input a positive integer n. If n is even, the algorithm divides it by two, and if n is odd, the algorithm multiplies it by three and adds one. The algorithm repeats this, until n is one.\n\nFor example, the sequence for n=3 is as follows:\n3 -> 10 -> 5 -> 16 -> 8 -> 4 -> 2 -> 1\n\nYour task is to simulate the execution of the algorithm for a given value of n.",
        inputFormat: "The only input line contains an integer n.",
        outputFormat: "Print a line that contains all values of n during the algorithm.",
        constraints: "1 <= n <= 10^6",
        samples: [
            { id: "1", in: "3\n", out: "3 10 5 16 8 4 2 1\n" },
        ],
        hidden: [
            { id: "1", in: "1\n", out: "1\n" },
            { id: "2", in: "20\n", out: "20 10 5 16 8 4 2 1\n" },
            { id: "3", in: "7\n", out: "7 22 11 34 17 52 26 13 40 20 10 5 16 8 4 2 1\n" },
        ],
    },
    {
        title: "Missing Number",
        slug: "missing-number",
        category: "Introductory Problems",
        order: 2,
        difficulty: "Easy",
        timeLimit: 1000,
        memoryLimit: 256,
        checkerType: "exact",
        description:
            "You are given all numbers between 1, 2, ..., n except one. Your task is to find the missing number.",
        inputFormat:
            "The first input line contains an integer n.\nThe second line contains n-1 integers. Each number is distinct and between 1 and n (inclusive).",
        outputFormat: "Print the missing number.",
        constraints: "2 <= n <= 2 * 10^5",
        samples: [
            { id: "1", in: "5\n2 3 1 5\n", out: "4\n" },
        ],
        hidden: [
            { id: "1", in: "2\n2\n", out: "1\n" },
            { id: "2", in: "2\n1\n", out: "2\n" },
            { id: "3", in: "10\n4 7 9 2 1 5 8 10 6\n", out: "3\n" },
        ],
    },
    {
        title: "Repetitions",
        slug: "repetitions",
        category: "Introductory Problems",
        order: 3,
        difficulty: "Easy",
        timeLimit: 1000,
        memoryLimit: 256,
        checkerType: "exact",
        description:
            "You are given a DNA sequence: a string consisting of characters A, C, G, and T. Your task is to find the longest repetition in the sequence, i.e., the maximum-length substring containing only one type of character.",
        inputFormat: "The only input line contains a string of n characters, each of which is A, C, G, or T.",
        outputFormat: "Print one integer: the length of the longest repetition.",
        constraints: "1 <= n <= 10^6",
        samples: [
            { id: "1", in: "ATTCGGGA\n", out: "3\n" },
        ],
        hidden: [
            { id: "1", in: "A\n", out: "1\n" },
            { id: "2", in: "ACGTACGT\n", out: "1\n" },
            { id: "3", in: "CCCC\n", out: "4\n" },
            { id: "4", in: "AAGGGTTTTCCCCCA\n", out: "5\n" },
        ],
    },
    {
        title: "Increasing Array",
        slug: "increasing-array",
        category: "Introductory Problems",
        order: 4,
        difficulty: "Easy",
        timeLimit: 1000,
        memoryLimit: 256,
        checkerType: "exact",
        description:
            "You are given an array of n integers. You want to modify the array so that it is increasing, i.e., every element is at least as large as the previous element.\n\nOn each move, you may increase the value of any element by one. What is the minimum number of moves required?",
        inputFormat:
            "The first input line contains an integer n: the size of the array.\nThen, the second line contains n integers x_1, x_2, ..., x_n: the contents of the array.",
        outputFormat: "Print the minimum number of moves.",
        constraints: "1 <= n <= 2 * 10^5\n1 <= x_i <= 10^9",
        samples: [
            { id: "1", in: "5\n3 2 5 1 7\n", out: "5\n" },
        ],
        hidden: [
            { id: "1", in: "1\n1000000000\n", out: "0\n" },
            { id: "2", in: "5\n10 1 1 1 1\n", out: "36\n" },
            { id: "3", in: "5\n1 2 3 4 5\n", out: "0\n" },
        ],
    },
    {
        title: "Sum of Two Values",
        slug: "two-sum",
        category: "Sorting and Searching",
        order: 1,
        difficulty: "Medium",
        timeLimit: 1000,
        memoryLimit: 256,
        checkerType: "exact",
        description:
            "You are given an array of n integers, and your task is to find two values (at distinct positions) whose sum is x.",
        inputFormat:
            "The first input line has two integers n and x: the array size and the target sum.\nThe second line has n integers a_1, a_2, ..., a_n: the array values.",
        outputFormat:
            "Print two integers: the positions of the values (1-indexed). If there are several solutions, you may print any of them. If there is no solution, print IMPOSSIBLE.",
        constraints: "1 <= n <= 2 * 10^5\n1 <= x, a_i <= 10^9",
        samples: [
            { id: "1", in: "4 8\n2 7 5 1\n", out: "2 4\n" },
        ],
        hidden: [
            { id: "1", in: "4 8\n1 2 3 4\n", out: "IMPOSSIBLE\n" },
            { id: "2", in: "2 10\n5 5\n", out: "1 2\n" },
            { id: "3", in: "5 7\n2 4 3 5 1\n", out: "1 4\n" },
        ],
    },
];

async function seed() {
    console.log("🌱 Starting CSES Problem Seeder...");
    await connectDB();

    // 1. Ensure Admin Account Exists
    let admin = await userModel.findOne({ role: "admin" });
    if (!admin) {
        console.log("Creating default administrator account (admin@cses.local)...");
        const hashedPassword = await bcrypt.hash("admin123", 10);
        admin = await userModel.create({
            username: "admin",
            email: "admin@cses.local",
            password: hashedPassword,
            role: "admin",
        });
        console.log("✅ Admin account created: admin@cses.local / admin123");
    }

    // 2. Base storage path
    const baseStorage = process.env.STORAGE_PATH
        ? path.resolve(process.env.STORAGE_PATH)
        : path.resolve(process.cwd(), "..", "storage");

    console.log(`Writing testcase files to: ${baseStorage}`);

    // 3. Seed Problems & Files
    for (const prob of PROBLEMS) {
        console.log(`\nSeeding problem: ${prob.title} (${prob.slug})...`);

        const problemDir = path.join(baseStorage, "problems", prob.slug);
        const samplesDir = path.join(problemDir, "samples");
        const hiddenDir = path.join(problemDir, "hidden");

        await fs.mkdir(samplesDir, { recursive: true });
        await fs.mkdir(hiddenDir, { recursive: true });

        // Write samples
        for (const sample of prob.samples) {
            await fs.writeFile(path.join(samplesDir, `${sample.id}.in`), sample.in, "utf-8");
            await fs.writeFile(path.join(samplesDir, `${sample.id}.out`), sample.out, "utf-8");
        }

        // Write hidden testcases
        for (const tc of prob.hidden) {
            await fs.writeFile(path.join(hiddenDir, `${tc.id}.in`), tc.in, "utf-8");
            await fs.writeFile(path.join(hiddenDir, `${tc.id}.out`), tc.out, "utf-8");
        }

        // Upsert Problem in MongoDB
        await problemModel.findOneAndUpdate(
            { slug: prob.slug },
            {
                title: prob.title,
                slug: prob.slug,
                category: prob.category,
                order: prob.order,
                difficulty: prob.difficulty,
                timeLimit: prob.timeLimit,
                memoryLimit: prob.memoryLimit,
                checkerType: prob.checkerType,
                description: prob.description,
                inputFormat: prob.inputFormat,
                outputFormat: prob.outputFormat,
                constraints: prob.constraints,
                storagePath: `storage/problems/${prob.slug}`,
                sampleTestcaseCount: prob.samples.length,
                hiddenTestcaseCount: prob.hidden.length,
                isPublished: true,
                createdBy: admin._id,
            },
            { upsert: true, new: true }
        );

        console.log(`  ✓ ${prob.samples.length} samples & ${prob.hidden.length} hidden testcases written!`);
    }

    console.log("\n==========================================");
    console.log("🎉 ALL CSES PROBLEMS SEEDED SUCCESSFULLY! 🎉");
    console.log("==========================================");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});

