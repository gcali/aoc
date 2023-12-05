import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";

type Range = {
    source: number;
    length: number;
}

const intersectRange = (a: Range, b: Range): Range | null => {
    const leftRange = a.source <= b.source ? a : b;
    const rightRange = leftRange === a ? b : a;
    if (leftRange.source + leftRange.length <= rightRange.source) {
        return null;
    }
    const start = rightRange.source;
    const end = Math.min(rightRange.source + rightRange.length, leftRange.source + leftRange.length);
    return {
        source: start,
        length: end - start
    };
}

export const ifYouGiveASeedAFertilizer = entryForFile(
    async ({ lines, resultOutputCallback }) => {
        const {seeds, mappings} = new Parser(lines)
            .header(2, (header, rest) => {
                const seeds = header
                    .slice(0, 1)
                    .stringParse(s => s
                        .ns()
                        .map(n => ({source: n, length: 1}))
                    ).first();
                const mappings = parseMappings(rest);
                return { seeds, mappings };
            })

        const min = findMinLocation(seeds, mappings);

        await resultOutputCallback(min);
    },
    async ({ lines, resultOutputCallback }) => {
        const {seeds, mappings} = new Parser(lines)
            .header(2, (header, rest) => {
                const seeds = header
                    .slice(0, 1)
                    .stringParse(s => s
                        .transform(/: (.*)/)
                        .pns()
                        .group(2)
                        .startLabeling()
                        .label(e => e, "source")
                        .label(e => e, "length")
                        .run()
                    )
                    .first();

                const mappings = parseMappings(rest);
                return { seeds, mappings };
            })

        let min = findMinLocation(seeds, mappings);

        await resultOutputCallback(min);
    },
    {
        key: "if-you-give-a-seed-a-fertilizer",
        title: "If You Give A Seed A Fertilizer",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 5,
        exampleInput,
        stars: 2
    }
);

const parseMappings = (rest: Parser) =>
    rest
        .group("")
        .groupMap(group => group.header(1, (mappingHeader, mappingRest) => {
            const destination = mappingHeader.transform(/.*-(\w+) /).first();
            const mapping = mappingRest
                .extractAllNumbers()
                .startLabeling()
                .label(e => e, "destination")
                .label(e => e, "source")
                .label(e => e, "length")
                .run();
            return {
                destination, mapping
            };
        })
        )
        .run();

const findMinLocation = (seeds: Range[], mappings: ReturnType<typeof parseMappings>) => {
    let min = Number.POSITIVE_INFINITY;
    for (const seedRange of seeds) {
        let ranges = [
            seedRange
        ];
        for (let i = 0; i < mappings.length; i++) {
            const mapping = mappings[i];
            const resultRanges: Range[] = [];
            for (const seedRange of ranges) {
                for (const range of mapping.mapping) {
                    const intersection = intersectRange(seedRange, range);
                    if (intersection !== null) {
                        const delta = intersection.source - range.source;
                        const newStart = range.destination + delta;
                        resultRanges.push({
                            source: newStart,
                            length: intersection.length
                        });
                    }
                }
            }
            ranges = resultRanges;
        }
        for (const range of ranges) {
            min = Math.min(min, range.source);
        }
    }
    return min;
}

