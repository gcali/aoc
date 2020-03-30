import { entryForFile } from "../../entry";
import { List } from "linq-typescript";

const basePattern = [0, 1, 0, -1];

export function applyPattern(elements: number[], pattern: Pattern) {
    return elements.map((_, position) =>
        Math.abs(
            elements
                .map((element, index) => ({ element, index }))
                .reduce((acc, next) => (acc + next.element * pattern.get(next.index, position)), 0)
            % 10)
    );
}

export async function applyPatternIteratively(
    elements: number[],
    pattern: Pattern,
    howManyTimes: number,
    debug?: (n: number) => Promise<void>
) {
    let current = 0;
    while (current++ < howManyTimes) {
        elements = applyPattern(elements, pattern);
        if (debug) {
            await debug(current);
        }
    }
    return elements;
}

export class Pattern {

    public get length() {
        return this.localBasePattern.length;
    }

    public static default(): Pattern {
        return new Pattern(basePattern);
    }
    constructor(private localBasePattern: number[]) {

    }

    public get(index: number, position: number): number {
        const factor = position + 1;
        const realIndex = Math.floor((index + 1) / factor);
        return this.localBasePattern[realIndex % basePattern.length];
    }
}

function parseLines(lines: string[]): number[] {
    return lines[0].split("").map((l) => parseInt(l, 10));
}



export const flawedFrequencyTransmission = entryForFile(
    async ({ lines, outputCallback, pause, isCancelled }) => {
        const input = parseLines(lines);
        const result = await applyPatternIteratively(input, Pattern.default(), 100);
        await outputCallback(new List(result).take(8).toArray().join(""));
    },
    async ({ lines, outputCallback, pause, isCancelled }) => {
        const input = parseLines(lines);
        const repeatedInput = Array.from({ length: 10000 }, () => input).flat();
        const result = await applyPatternIteratively(
            repeatedInput,
            Pattern.default(),
            100,
            async (n) => await outputCallback("Iteration " + n + " done")
        );
        await outputCallback(new List(result).skip(parseInt(input.join(""), 10)).take(8).toArray().join(""));
    }
);