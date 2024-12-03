import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";

export const mullItOver = entryForFile(
    async ({ lines, resultOutputCallback }) => {
        const memory = new Parser(lines)
            .run().join("\n");
        const instructionsRegex = /mul\((-?\d+),(-?\d+)\)/g
        const matches = [...memory.matchAll(instructionsRegex)];
        const result = matches.map(m => parseInt(m[1], 10) * parseInt(m[2], 10)).reduce((acc, next) => acc + next, 0);
        await resultOutputCallback(result);
    },
    async ({ lines, resultOutputCallback }) => {
        const memory = new Parser(lines)
            .run().join("\n");
        const instructionsRegex = /(?:mul\((-?\d+),(-?\d+)\))|(?:do\(\))|(?:don't\(\))/g
        const matches = memory.matchAll(instructionsRegex)
        let enabled = true;
        let result = 0;
        for (const match of matches) {
            if (match[0] === "do()") {
                enabled = true;
            } else if (match[0] === "don't()") {
                enabled = false;
            } else if (match[0].startsWith("mul(")) {
                if (enabled) {
                    const a = parseInt(match[1], 10);
                    const b = parseInt(match[2], 10);
                    result += a * b;
                }
            } else {
                throw new Error("Invalid instruction: " + match[0]);
            }
        }
        await resultOutputCallback(result);
    },
    {
        key: "mull-it-over",
        title: "Mull It Over",
        supportsQuickRunning: true,
        embeddedData: true,
        exampleInput: exampleInput,
        date: 3
    }
);