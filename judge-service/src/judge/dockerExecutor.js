import { spawn, execSync } from "child_process";
import path from "path";

const SANDBOX_IMAGE = process.env.DOCKER_SANDBOX_IMAGE || "cses-sandbox";
const MAX_BUFFER_SIZE = 5 * 1024 * 1024; // 5MB output cap

/**
 * Checks if Docker CLI and daemon are available.
 * @returns {boolean}
 */
export function isDockerAvailable() {
    try {
        execSync("docker info --format '{{.ServerVersion}}'", { stdio: "ignore", timeout: 3000 });
        return true;
    } catch {
        return false;
    }
}

/**
 * Formats a host filesystem path for Docker volume mounting.
 * Converts Windows backslashes to forward slashes.
 */
export function formatDockerPath(hostPath) {
    const resolved = path.resolve(hostPath);
    return resolved.replace(/\\/g, "/");
}

/**
 * Executes a command inside a sandboxed Docker container with strict security limits:
 * - Isolated network (--network none)
 * - Strict CPU and memory limits (-m, --memory-swap, --cpus)
 * - Fork-bomb protection (--pids-limit)
 * - Non-root unprivileged execution (--user sandbox)
 * - Dropped capabilities (--cap-drop ALL, no-new-privileges)
 * - Read-only code mounting for testcase evaluation
 *
 * @param {Object} options
 * @param {string} options.tempDir - Host directory containing code
 * @param {string} options.command - Command to run inside container
 * @param {Array<string>} [options.args=[]] - Arguments
 * @param {string} [options.input=""] - Stdin input string
 * @param {number} [options.timeLimit=2000] - Timeout in milliseconds
 * @param {number} [options.memoryLimit=256] - Memory limit in MB
 * @param {boolean} [options.isReadOnly=true] - Mount directory as read-only (:ro) or read-write (:rw)
 * @returns {Promise<{ exitCode: number|null, stdout: string, stderr: string, executionTimeMs: number, isTimeLimitExceeded: boolean, error: Error|null }>}
 */
export function executeInDocker({
    tempDir,
    command,
    args = [],
    input = "",
    timeLimit = 2000,
    memoryLimit = 256,
    isReadOnly = true,
}) {
    return new Promise((resolve) => {
        const startTime = process.hrtime.bigint();
        const containerName = `cses-sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const volumeMount = `${formatDockerPath(tempDir)}:/sandbox:${isReadOnly ? "ro" : "rw"}`;

        const dockerArgs = [
            "run",
            "-i",
            "--rm",
            `--name=${containerName}`,
            "--network=none",
            "--cpus=1.0",
            `-m=${memoryLimit}m`,
            `--memory-swap=${memoryLimit}m`,
            "--pids-limit=32",
            "--user=sandbox",
            "--security-opt=no-new-privileges",
            "--cap-drop=ALL",
            "-v", volumeMount,
            "-w", "/sandbox",
            SANDBOX_IMAGE,
            command,
            ...args,
        ];

        let stdout = "";
        let stderr = "";
        let isFinished = false;
        let isTimeLimitExceeded = false;

        let child;
        try {
            child = spawn("docker", dockerArgs, {
                stdio: ["pipe", "pipe", "pipe"],
                windowsHide: true,
            });
        } catch (err) {
            return resolve({
                exitCode: 1,
                stdout: "",
                stderr: `Docker execution error: ${err.message}`,
                executionTimeMs: 0,
                isTimeLimitExceeded: false,
                error: err,
            });
        }

        // Timeout killer
        const timer = setTimeout(() => {
            isTimeLimitExceeded = true;
            try {
                // Forcefully kill container
                spawn("docker", ["kill", containerName], { stdio: "ignore", windowsHide: true });
            } catch {
                // Ignore kill errors
            }
            try {
                if (child && !child.killed) {
                    child.kill("SIGKILL");
                }
            } catch {
                // Ignore process kill errors
            }
        }, timeLimit + 200); // 200ms grace period

        child.stdout.on("data", (chunk) => {
            if (stdout.length < MAX_BUFFER_SIZE) {
                stdout += chunk.toString();
            }
        });

        child.stderr.on("data", (chunk) => {
            if (stderr.length < MAX_BUFFER_SIZE) {
                stderr += chunk.toString();
            }
        });

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

        child.on("close", (code) => {
            if (isFinished) return;
            isFinished = true;
            clearTimeout(timer);

            const endTime = process.hrtime.bigint();
            const executionTimeMs = Number((endTime - startTime) / 1000000n);

            if (isTimeLimitExceeded) {
                return resolve({
                    exitCode: code,
                    stdout,
                    stderr: stderr || "Time Limit Exceeded",
                    executionTimeMs: Math.max(executionTimeMs, timeLimit),
                    isTimeLimitExceeded: true,
                    error: null,
                });
            }

            // Docker exit code 137 indicates container was killed (e.g. OOM or SIGKILL)
            const isOOM = code === 137 && stderr.toLowerCase().includes("killed");

            resolve({
                exitCode: code !== null ? code : 0,
                stdout,
                stderr: isOOM ? "Memory Limit Exceeded (Container OOM Killed)" : stderr,
                executionTimeMs,
                isTimeLimitExceeded: false,
                error: null,
            });
        });

        // Pipe input to container stdin
        if (child.stdin) {
            try {
                if (input) {
                    child.stdin.write(input);
                }
            } catch {
                // Ignore write errors
            }
            try {
                child.stdin.end();
            } catch {
                // Ignore end errors
            }
        }
    });
}

