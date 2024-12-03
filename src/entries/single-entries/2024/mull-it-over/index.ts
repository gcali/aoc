import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";
import { buildCommunicator } from "./communication";

export const mullItOver = entryForFile(
    async ({ lines, resultOutputCallback, sendMessage, pause, setAutoStop }) => {
        setAutoStop();
        const memory = new Parser(lines)
            .run().join("\n");
        const instructionsRegex = /mul\((-?\d+),(-?\d+)\)/g
        const communicator = buildCommunicator(sendMessage, pause);
        const matches = [...memory.matchAll(instructionsRegex)];
        if (communicator) {
            await communicator.sendCode(memory);
            let res = 0;
            for (const match of matches) {
                if (match.index) {
                    const communicationMatch = {
                        index: match.index,
                        length: match[0].length
                    }
                    await communicator.sendMatch(communicationMatch);
                    const [a,b] = [match[1], match[2]].map(e => parseInt(e, 10));
                    res += a*b;
                    await communicator.sendResult(res);
                }
            }
        }
        const result = matches.map(m => parseInt(m[1], 10) * parseInt(m[2], 10)).reduce((acc, next) => acc + next, 0);
        await resultOutputCallback(result);
    },
    async ({ lines, resultOutputCallback, sendMessage, pause }) => {
        const memory = new Parser(lines)
            .run().join("\n");
        const instructionsRegex = /(?:mul\((-?\d+),(-?\d+)\))|(?:do\(\))|(?:don't\(\))/g
        const matches = memory.matchAll(instructionsRegex)
        let enabled = true;
        let result = 0;
        const communicator = buildCommunicator(sendMessage, pause);
        if (communicator) {
            await communicator.sendCode(memory);
        }
        for (const match of matches) {
            if (match[0] === "do()") {
                if (!enabled) {
                    await communicator.sendEnabled(true);
                }
                enabled = true;
            } else if (match[0] === "don't()") {
                if (enabled) {
                    await communicator.sendEnabled(false);
                }
                enabled = false;
            } else if (match[0].startsWith("mul(")) {
                if (enabled) {
                    const a = parseInt(match[1], 10);
                    const b = parseInt(match[2], 10);
                    result += a * b;
                    await communicator.sendResult(result);
                }
            } else {
                throw new Error("Invalid instruction: " + match[0]);
            }
            if (match.index) {
                const communicationMatch = {
                    index: match.index,
                    length: match[0].length
                }
                await communicator.sendMatch(communicationMatch);
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
        date: 3,
        stars: 2
    }
);