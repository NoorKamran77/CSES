import { spawn } from "child_process";
import os from "os";

const isWindows = os.platform() === "win32";
const MAX_BUFFER_SIZE = 5 * 1024 * 1024; // 5MB max output buffer

/**
 * Executes a process with timeout, stdin input, and resource tracking.
 *
 * @param {Object} options
 * @param {string} options.command - The executable command
 * @param {Array<string>} options.args - Command line arguments
 * @param {string} options.cwd - Working directory
 * @param {string} [options.input] - Stdin input string
 * @param {number} [options.timeLimit=2000] - Timeout limit in milliseconds
 * @returns {Promise<{ exitCode: number|null, stdout: string, stderr: string, executionTimeMs: number, isTimeLimitExceeded: boolean, error: Error|null }>}
 */
export function executeProcess({ command, args = [], cwd, input = "", timeLimit = 2000 }) {
    return new Promise((resolve) => {
        const startTime = process.hrtime.bigint();
        let isTimeLimitExceeded = false;
        let stdout = "";
        let stderr = "";
        let isFinished = false;

        let child;
        try {
            child = spawn(command, args, {
                cwd,
                stdio: ["pipe", "pipe", "pipe"],
                windowsHide: true,
                shell: false,
            });
        } catch (err) {
            return resolve({
                exitCode: 1,
                stdout: "",
                stderr: err.message,
                executionTimeMs: 0,
                isTimeLimitExceeded: false,
                error: err,
            });
        }


        // Set timeout killer
        const timer = setTimeout(() => {
            isTimeLimitExceeded = true;
            try {
                if (child && !child.killed) {
                    if (isWindows && child.pid) {
                        try {
                            // On Windows force kill process tree
                            spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true });
                        } catch {
                            child.kill("SIGKILL");
                        }
                    } else {
                        child.kill("SIGKILL");
                    }
                }
            } catch {
                // Ignore kill errors
            }
        }, timeLimit + 100); // 100ms grace period

        // Handle stdout
        child.stdout.on("data", (chunk) => {
            if (stdout.length < MAX_BUFFER_SIZE) {
                stdout += chunk.toString();
            }
        });

        // Handle stderr
        child.stderr.on("data", (chunk) => {
            if (stderr.length < MAX_BUFFER_SIZE) {
                stderr += chunk.toString();
            }
        });

        // Handle error (e.g., command not found)
        child.on("error", (err) => {
            if (isFinished) return;
            isFinished = true;
            clearTimeout(timer);
            const endTime = process.hrtime.bigint();
            const executionTimeMs = Number((endTime - startTime) / 1000000n);

            resolve({
                exitCode: 1,
                stdout,
                stderr: stderr || err.message,
                executionTimeMs,
                isTimeLimitExceeded: false,
                error: err,
            });
        });

        // Handle process exit
        child.on("close", (code, signal) => {
            if (isFinished) return;
            isFinished = true;
            clearTimeout(timer);

            const endTime = process.hrtime.bigint();
            const executionTimeMs = Number((endTime - startTime) / 1000000n);

            if (isTimeLimitExceeded || signal === "SIGKILL" || signal === "SIGTERM") {
                return resolve({
                    exitCode: code,
                    stdout,
                    stderr: stderr || "Time Limit Exceeded",
                    executionTimeMs: Math.max(executionTimeMs, timeLimit),
                    isTimeLimitExceeded: true,
                    error: null,
                });
            }

            resolve({
                exitCode: code !== null ? code : 0,
                stdout,
                stderr,
                executionTimeMs,
                isTimeLimitExceeded: false,
                error: null,
            });
        });

        // Write input to stdin and close stdin stream
        if (input && child.stdin) {
            try {
                child.stdin.write(input);
                child.stdin.end();
            } catch {
                // Ignore write errors if process exited early
            }
        } else if (child.stdin) {
            child.stdin.end();
        }
    });
}
