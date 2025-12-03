import { entryForFile } from "../../../entry";
import { exampleInput } from "./example";

const findHighestWithIndex = (line: number[], ignoreIndexes: number[]): {index: number; value: number} | null => {
    let value = null;
    let index = null;
    for (let i = 0; i < line.length; i++) {
        if (ignoreIndexes.includes(i)) {
            continue;
        } else if (value === null) {
            value = line[i];
            index = i;
        } else if (value < line[i]) {
            value = line[i];
            index = i;
        }
    }
    return (value !== null && index !== null) ? {value, index} : null;
}

const findHighestN = (line: number[], n: number): number[] | null => {
    const skipped: number[] = [];
    while (skipped.length < line.length) {
        const currentCandidate = findHighestWithIndex(line, skipped);
        if (currentCandidate === null) {
            return null;
        }
        if (n === 1) {
            return [currentCandidate.value];
        }
        const subSearch = findHighestN(line.slice(currentCandidate.index + 1), n-1);
        if (subSearch !== null) {
            return [currentCandidate.value, ...subSearch];
        } else {
            skipped.push(currentCandidate.index);
        }
    }
    return null;
}

const mul = (n: number[]): number => {
    let result = 0;
    for (const x of n) {
        result *= 10;
        result += x;
    }
    return result;
}

export const lobby = entryForFile(
    //00:09:08
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const banks = lines.map(line => line.split("").map(e => parseInt(e, 10)));
        let result = 0;
        for (const bank of banks) {
            const current = findHighestN(bank, 2);
            if (current === null) {
                throw new Error("Invalid");
            }
            result += current.reduce((acc, next) => acc * 10 + next, 0);
        }
        await resultOutputCallback(result);
    },
    //00:25:56
    async ({ lines, outputCallback, resultOutputCallback }) => {
        let banks = lines.map(line => line.split("").map(e => parseInt(e, 10)));
        let result = 0;
        for (const bank of banks) {
            const current = findHighestN(bank, 12);
            if (current === null) {
                throw new Error("Invalid");
            }
            result += current.reduce((acc, next) => acc * 10 + next, 0);
        }
        await resultOutputCallback(result);
    },
    {
        key: "lobby",
        title: "Lobby",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 3,
        exampleInput: exampleInput,
        stars: 2
    }
);