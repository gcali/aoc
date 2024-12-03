import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";

export const rednosedReports = entryForFile(
    async ({ lines, resultOutputCallback }) => {
        const levels = new Parser(lines)
            .stringParse(s => s.ns())
            .run();
        const slopeList = levels.map(calculateSlopes);
        const safety = slopeList.map(findSlopeSafety);
        await resultOutputCallback(safety.filter(s => s).length);
    },
    async ({ lines, resultOutputCallback }) => {
        const levels = new Parser(lines)
            .stringParse(s => s.ns())
            .run();
        const safety = levels.map(findSafetyOfSublevel);
        await resultOutputCallback(safety.filter(s => s).length);
    },
    {
        key: "rednosed-reports",
        title: "RedNosed Reports",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 2,
        stars: 2,
        exampleInput: exampleInput
    }
);

function findSafetyOfSublevel(level: number[]) {
    for (let toSkip = -1; toSkip < level.length; toSkip++) {
        const slopes = calculateSlopes(level.filter((_, j) => j !== toSkip));
        const isSafe = findSlopeSafety(slopes);
        if (isSafe) {
            return true;
        }
    }
    return false;
}

function calculateSlopes(level: number[]) {
    return level.slice(1).map((n, i) => level[i] - n)
}

function findSlopeSafety(slopeList: number[]) {
    const sign = Math.sign(slopeList[0]);
    let isSafe = sign !== 0;
    for (const slope of slopeList) {
        if (Math.sign(slope) !== sign) {
            isSafe = false;
            break;
        }
        if (Math.abs(slope) < 1 || Math.abs(slope) > 3) {
            isSafe = false;
            break;
        }
    }
    return isSafe;
}
