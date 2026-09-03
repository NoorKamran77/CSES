/**
 * Normalizes text output by:
 * 1. Converting \r\n to \n
 * 2. Trimming trailing whitespace from each line
 * 3. Trimming trailing blank lines from the end of the output
 */
export function normalizeOutput(text) {
    if (typeof text !== "string") return "";

    return text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .trim();
}

/**
 * Exact output comparator.
 */
export function checkExact(actual, expected) {
    const normActual = normalizeOutput(actual);
    const normExpected = normalizeOutput(expected);
    return normActual === normExpected;
}

/**
 * Floating-point output comparator with relative and absolute epsilon tolerance.
 */
export function checkFloating(actual, expected, epsilon = 1e-6) {
    const actualTokens = normalizeOutput(actual).split(/\s+/).filter(Boolean);
    const expectedTokens = normalizeOutput(expected).split(/\s+/).filter(Boolean);

    if (actualTokens.length !== expectedTokens.length) {
        return false;
    }

    for (let i = 0; i < actualTokens.length; i++) {
        const act = actualTokens[i];
        const exp = expectedTokens[i];

        const actNum = Number(act);
        const expNum = Number(exp);

        if (!isNaN(actNum) && !isNaN(expNum)) {
            const diff = Math.abs(actNum - expNum);
            const maxVal = Math.max(Math.abs(actNum), Math.abs(expNum), 1.0);
            if (diff > epsilon && diff / maxVal > epsilon) {
                return false;
            }
        } else {
            if (act !== exp) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Master output checker.
 *
 * @param {string} actual - Output produced by the program
 * @param {string} expected - Expected output from .out test case file
 * @param {string} [checkerType="exact"] - "exact" or "floating"
 * @returns {boolean}
 */
export function checkOutput(actual, expected, checkerType = "exact") {
    if (checkerType === "floating") {
        return checkFloating(actual, expected);
    }
    return checkExact(actual, expected);
}

