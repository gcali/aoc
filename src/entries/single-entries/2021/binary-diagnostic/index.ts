import { LinkedList } from "../../../../support/data-structure";
import { entryForFile, ResultOutputCallback } from "../../../entry";
import { firstFactory, secondFactory } from "./visualizer";

const countMostCommon = async (
    bits: string[][],
    index: number,
    onIteration?: (currentCount: number) => Promise<void>
): Promise<string | null> => {
    let counter0 = 0;
    for (const x of bits) {
        if (x[index] === "0") {
            counter0++;
        }
        if (onIteration) {
            await onIteration(counter0);
        }
    }

    if (counter0 > bits.length / 2) {
        return "0";
    } else if (counter0 < bits.length / 2) {
        return "1";
    } else {
        return null;
    }
};

export const opposite = (b: string): string => b === "0" ? "1" : "0";
const replaceArray = (destination: string[], data: string[]) => destination.splice(0, Infinity, ...data);

const parseBinary = (b: string[]) => parseInt(b.join(""), 2);

export const binaryDiagnostic = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback, pause, isQuickRunning }) => {
        const els = lines.filter((l) => l).map((l) => l.split(""));

        const gamma: string[] = [];
        const power: string[] = [];

        const visualizerFactory = firstFactory(outputCallback, pause, isQuickRunning, { gamma, power });

        for (let i = 0; i < els[0].length; i++) {
            const vs = visualizerFactory(i);
            const mostCommon = await countMostCommon(els, i, vs);
            if (mostCommon === null) {
                throw new Error("Invalid count");
            }
            gamma[i] = mostCommon;
            power[i] = opposite(mostCommon);
        }

        await resultOutputCallback(parseBinary(gamma) * parseBinary(power));
    },
    async ({ lines, outputCallback, resultOutputCallback, isQuickRunning, pause }) => {
        const els = lines.filter((l) => l).map((l) => l.split(""));

        const oxygen: string[] = [];
        const co2: string[] = [];

        const iterations = [
            { data: oxygen, remaining: els.slice(), mapper: (e: string) => e },
            { data: co2, remaining: els.slice(), mapper: opposite },
        ];

        const print = secondFactory(outputCallback, pause, isQuickRunning, {oxygen, co2});
        for (const iteration of iterations) {
            for (let i = 0; i < els[0].length; i++) {
                const mostCommon = await countMostCommon(iteration.remaining, i);
                const nextBit = iteration.mapper(mostCommon || "1");
                iteration.remaining = iteration.remaining.filter((e) => e[i] === nextBit);
                if (iteration.remaining.length === 1) {
                    replaceArray(iteration.data, iteration.remaining[0]);
                    break;
                }
                iteration.data.push(nextBit);
                await print();
            }
            await print();
        }


        await resultOutputCallback(parseBinary(oxygen) * parseBinary(co2));
    },
    {
        key: "binary-diagnostic",
        title: "Binary Diagnostic",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        suggestedDelay: 100
    }
);
