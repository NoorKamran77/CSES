import path from "path";
import os from "os";

const isWindows = os.platform() === "win32";

export const LANGUAGE_CONFIG = {
    cpp: {
        name: "C++ (GCC)",
        sourceFileName: "solution.cpp",
        needsCompile: true,
        getCompileCommand: (dir) => {
            const outputExecutable = isWindows ? "solution.exe" : "solution";
            return {
                command: "g++",
                args: ["-O2", "-std=c++17", "solution.cpp", "-o", outputExecutable],
                cwd: dir,
            };
        },
        getRunCommand: (dir) => {
            const executable = isWindows ? path.join(dir, "solution.exe") : `./solution`;
            return {
                command: isWindows ? executable : "./solution",
                args: [],
                cwd: dir,
            };
        },
    },

    python: {
        name: "Python 3",
        sourceFileName: "solution.py",
        needsCompile: false,
        getRunCommand: (dir) => {
            // Use 'python' or 'python3' based on environment
            const pythonCmd = process.env.PYTHON_BIN || (isWindows ? "python" : "python3");
            return {
                command: pythonCmd,
                args: ["solution.py"],
                cwd: dir,
            };
        },
    },

    java: {
        name: "Java",
        sourceFileName: "Solution.java",
        needsCompile: true,
        getCompileCommand: (dir) => {
            return {
                command: "javac",
                args: ["Solution.java"],
                cwd: dir,
            };
        },
        getRunCommand: (dir) => {
            return {
                command: "java",
                args: ["-Xmx256M", "Solution"],
                cwd: dir,
            };
        },
    },

    javascript: {
        name: "JavaScript (Node.js)",
        sourceFileName: "solution.js",
        needsCompile: false,
        getRunCommand: (dir) => {
            return {
                command: process.env.NODE_BIN || "node",
                args: ["solution.js"],
                cwd: dir,
            };
        },
    },
};

export function getLanguageConfig(language) {
    const config = LANGUAGE_CONFIG[language?.toLowerCase()];
    if (!config) {
        throw new Error(`Unsupported language: ${language}`);
    }
    return config;
}

