import { entryForFile } from "../../../entry";
import { buildVisualizer } from "./visualizer";

export type Range = {
    from: number;
    to: number;
}

export type Pair = {
    a: Range;
    b: Range;
    id: number;
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
    lines.map((line, index) => {
        const [a, b] = line.split(",");
        return {
            a: parseRange(a),
            b: parseRange(b),
            id: index
        }
    });

export const campCleanup = entryForFile(
    async ({ lines, resultOutputCallback, screen, pause }) => {

        const visualizer = buildVisualizer(screen, pause);
        
        const pairs = parseInput(lines);

        await visualizer.showPairs(pairs);

        const interesting = pairs.filter(pair => isIncludedIn(pair.a, pair.b) || isIncludedIn(pair.b, pair.a));

        await visualizer.higlightPairs(interesting);

        await resultOutputCallback(interesting.length);
    },
    async ({ lines, resultOutputCallback, screen, pause }) => {

        const visualizer = buildVisualizer(screen, pause);

        const pairs = parseInput(lines);

        await visualizer.showPairs(pairs);

        const interesting = pairs.filter(pair => overlap(pair.a, pair.b));

        await visualizer.higlightPairs(interesting);

        await resultOutputCallback(interesting.length);
    },
    {
        key: "camp-cleanup",
        title: "Camp Cleanup",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        suggestedDelay: 10
    }
);