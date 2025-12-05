import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";

type Range = {
    start: number;
    end: number;
}

const parseInput = (lines: string[]) => {
    let isParsingIngredients = false;
    const ranges: Range[] = [];
    const ingredients: number[] = [];
    for (const line of lines) {
        if (line === "") {
            isParsingIngredients = true;
        } else {
            if (!isParsingIngredients) {
                const [a,b] = line.split("-");
                ranges.push({
                    start: parseInt(a, 10),
                    end: parseInt(b, 10)
                });
            } else {
                ingredients.push(parseInt(line, 10));
            }
        }
    }
    return {ranges, ingredients};
}

const isInRange = (ingredient: number, range: Range) => {
    return ingredient >= range.start && ingredient <= range.end;
}

const isFresh = (ingredient: number, ranges: Range[]) => {
    const res = ranges.some(range => isInRange(ingredient, range));
    return res;
}

const mergeRanges = (ranges: Range[]) => {
    ranges = [...ranges]
    ranges.sort((a, b) => a.start - b.start);
    for (let i = 0; i < ranges.length - 1; i++) {
        if (ranges[i].end >= ranges[i + 1].start - 1) {
            ranges[i + 1].start = Math.min(ranges[i].start, ranges[i + 1].start);
            ranges[i + 1].end = Math.max(ranges[i].end, ranges[i + 1].end);
            ranges[i].start = -1;
        }
    }
    ranges = ranges.filter((e) => e.start >= 0);
    return ranges;
}

export const cafeteria = entryForFile(
    //00:06:50
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const stuff = parseInput(lines);
        const fresh = stuff.ingredients.filter(i => isFresh(i, stuff.ranges));
        await resultOutputCallback(fresh.length);
    },
    //00:14:19
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const stuff = parseInput(lines);
        const mergedRanges = mergeRanges(stuff.ranges);
        const howManyFresh = mergedRanges.map(range => range.end - range.start + 1);
        await resultOutputCallback(howManyFresh.reduce((acc, next) => acc + next, 0));
    },
    {
        key: "cafeteria",
        title: "Cafeteria",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 5,
        exampleInput: exampleInput,
        stars: 2
    }
);