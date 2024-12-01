import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { DefaultDict } from "../../../../support/data-structure";

export const historianHysteria = entryForFile(
    async ({ lines, resultOutputCallback }) => {
        const lists = parseInput(lines);

        const distances = lists.first.map((e, i) => Math.abs(e - lists.second[i]));
        const result = distances.reduce((acc, next) => acc + next, 0);

        await resultOutputCallback(result);
    },
    async ({ lines, resultOutputCallback }) => {
        const lists = parseInput(lines);

        const similarityCecker = new DefaultDict<number, number>(() => 0);
        for (const n of lists.second) {
            similarityCecker.update(n, v => v + 1);
        }

        const similarities = lists.first.map(e => e * similarityCecker.get(e));
        const result = similarities.reduce((acc, next) => acc + next, 0);

        await resultOutputCallback(result);
    },
    {
        key: "historian-hysteria",
        title: "Historian Hysteria",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 1,
        stars: 2
    }
);

function parseInput(lines: string[]) {
    const ns = new Parser(lines)
        .tokenize(/\s+/)
        .mapTokens(s => s.n());

    const lists = {
        "first": ns.map(e => e[0]).sort(),
        "second": ns.map(e => e[1]).sort()
    };
    return lists;
}
