import { entryForFile } from "../../../entry";

type Range = {
    from: number;
    to: number;
}

type Pair = {
    a: Range;
    b: Range;
}

const isIncludedIn = (outer: Range, inner: Range) => {
    return outer.from <= inner.from && outer.to >= inner.to;
}

const overlap = (a: Range, b: Range) => {
    if (a.from > b.to || a.to < b.from) {
        return false;
    } else {
        return true;
    }
}

const parseRange = (token: string): Range => {
    const [from,to] = token.split("-").map(e => parseInt(e, 10));
    return {from, to}
}

const parseInput = (lines: string[]): Pair[] => 
    lines.map(line => {
        const [a, b] = line.split(",");
        return {
            a: parseRange(a),
            b: parseRange(b)
        }
    });

export const campCleanup = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        
        const pairs = parseInput(lines);

        const interesting = pairs.filter(pair => isIncludedIn(pair.a, pair.b) || isIncludedIn(pair.b, pair.a));

        await resultOutputCallback(interesting.length);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const pairs = parseInput(lines);

        const interesting = pairs.filter(pair => overlap(pair.a, pair.b));

        await resultOutputCallback(interesting.length);
    },
    {
        key: "camp-cleanup",
        title: "Camp Cleanup",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);