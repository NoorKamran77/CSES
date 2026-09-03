import fs from "fs/promises";
import path from "path";
import submissionModel from "../models/submissionModel.js";
import problemModel from "../models/problemModel.js";
import userModel from "../models/userModel.js";
import { getLanguageConfig } from "./compilers.js";
import { executeProcess } from "./executor.js";
import { checkOutput } from "./checker.js";

function getStorageRoot() {
    // Check if we are running inside judge-service or project root
    const cwd = process.cwd();
    if (cwd.endsWith("judge-service") || cwd.endsWith("backend")) {
        return path.resolve(cwd, "..", "storage");
    }
    return path.join(cwd, "storage");
}

function getTempRoot() {
    const cwd = process.cwd();
    return path.join(cwd, "temp", "submissions");
}

export async function judge(submissionId) {
    let tempDir = null;

    try {
        const submission = await submissionModel.findById(submissionId);
        if (!submission) {
            console.error(`[JudgeEngine] Submission not found: ${submissionId}`);
            return;
        }

        const problem = await problemModel.findById(submission.problemId);
        if (!problem) {
            await submissionModel.findByIdAndUpdate(submissionId, {
                status: "Internal Error",
                errorMessage: "Associated problem not found",
            });
            return;
        }

        console.log(`[JudgeEngine] Judging submission ${submissionId} for problem '${problem.slug}' (${submission.language})`);

        // Set status to Compiling
        await submissionModel.findByIdAndUpdate(submissionId, { status: "Compiling" });

        const langConfig = getLanguageConfig(submission.language);
        tempDir = path.join(getTempRoot(), String(submissionId));
        await fs.mkdir(tempDir, { recursive: true });

        // Write source code
        const sourcePath = path.join(tempDir, langConfig.sourceFileName);
        await fs.writeFile(sourcePath, submission.sourceCode, "utf-8");

        // 1. Compilation Phase (if needed)
        if (langConfig.needsCompile) {
            const { command, args, cwd } = langConfig.getCompileCommand(tempDir);
            const compileResult = await executeProcess({
                command,
                args,
                cwd,
                timeLimit: 15000, // 15s max compilation time
            });

            if (compileResult.exitCode !== 0 || compileResult.isTimeLimitExceeded) {
                const compilerOutput = (compileResult.stderr || compileResult.stdout || "Compilation failed").slice(0, 4000);
                console.log(`[JudgeEngine] Submission ${submissionId} -> Compilation Error`);

                await submissionModel.findByIdAndUpdate(submissionId, {
                    status: "Compilation Error",
                    compilerOutput,
                    errorMessage: "Compilation failed",
                });
                return;
            }
        }

        // Set status to Running
        await submissionModel.findByIdAndUpdate(submissionId, { status: "Running" });

        // 2. Discover Test Cases
        const storageRoot = getStorageRoot();
        const problemStorageDir = path.join(storageRoot, "problems", problem.slug);
        const hiddenDir = path.join(problemStorageDir, "hidden");
        const samplesDir = path.join(problemStorageDir, "samples");

        let testCaseDir = hiddenDir;
        let testFiles = [];

        try {
            const files = await fs.readdir(hiddenDir);
            testFiles = files.filter((f) => f.endsWith(".in"));
        } catch {
            // hidden dir doesn't exist or is empty
        }

        if (testFiles.length === 0) {
            try {
                const files = await fs.readdir(samplesDir);
                testFiles = files.filter((f) => f.endsWith(".in"));
                if (testFiles.length > 0) {
                    testCaseDir = samplesDir;
                }
            } catch {
                // samples dir doesn't exist
            }
        }

        // Sort test cases numerically if possible (1.in, 2.in, 10.in)
        testFiles.sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
        });

        if (testFiles.length === 0) {
            console.log(`[JudgeEngine] No test cases found for problem '${problem.slug}', marking Accepted`);
            await submissionModel.findByIdAndUpdate(submissionId, {
                status: "Accepted",
                executionTime: 0,
                memoryUsed: 0,
                errorMessage: "No test cases configured on problem",
            });
            return;
        }

        // 3. Execution & Evaluation Loop
        let maxExecutionTime = 0;
        let finalVerdict = "Accepted";
        let errorMessage = "";
        const timeLimit = problem.timeLimit || 1000;

        for (let i = 0; i < testFiles.length; i++) {
            const inFile = testFiles[i];
            const testId = inFile.replace(/\.in$/, "");
            const outFile = `${testId}.out`;

            const inputContent = await fs.readFile(path.join(testCaseDir, inFile), "utf-8");
            let expectedOutput = "";
            try {
                expectedOutput = await fs.readFile(path.join(testCaseDir, outFile), "utf-8");
            } catch {
                // out file might not exist
            }

            const { command, args, cwd } = langConfig.getRunCommand(tempDir);
            const runResult = await executeProcess({
                command,
                args,
                cwd,
                input: inputContent,
                timeLimit,
            });

            maxExecutionTime = Math.max(maxExecutionTime, runResult.executionTimeMs);

            // Check Time Limit Exceeded
            if (runResult.isTimeLimitExceeded) {
                finalVerdict = "Time Limit Exceeded";
                errorMessage = `Time Limit Exceeded on testcase ${i + 1}`;
                break;
            }

            // Check Runtime Error
            if (runResult.exitCode !== 0) {
                finalVerdict = "Runtime Error";
                errorMessage = (runResult.stderr || `Runtime error (exit code ${runResult.exitCode}) on testcase ${i + 1}`).slice(0, 2000);
                break;
            }

            // Check Wrong Answer
            const isMatch = checkOutput(runResult.stdout, expectedOutput, problem.checkerType || "exact");
            if (!isMatch) {
                finalVerdict = "Wrong Answer";
                errorMessage = `Wrong Answer on testcase ${i + 1}`;
                break;
            }
        }

        console.log(`[JudgeEngine] Submission ${submissionId} -> Verdict: ${finalVerdict} (Max Time: ${maxExecutionTime}ms)`);

        // 4. Update Submission in Database
        await submissionModel.findByIdAndUpdate(submissionId, {
            status: finalVerdict,
            executionTime: maxExecutionTime,
            errorMessage,
        });

        // 5. Update User's solvedProblems on Accepted verdict
        if (finalVerdict === "Accepted" && submission.userId) {
            await userModel.findByIdAndUpdate(submission.userId, {
                $addToSet: { solvedProblems: problem._id },
            });
        }

    } catch (err) {
        console.error(`[JudgeEngine] Error judging submission ${submissionId}:`, err);
        try {
            await submissionModel.findByIdAndUpdate(submissionId, {
                status: "Internal Error",
                errorMessage: err.message,
            });
        } catch {
            // Ignore secondary error
        }
    } finally {
        // Cleanup temp folder
        if (tempDir) {
            try {
                await fs.rm(tempDir, { recursive: true, force: true });
            } catch {
                // Ignore cleanup error
            }
        }
    }
}

