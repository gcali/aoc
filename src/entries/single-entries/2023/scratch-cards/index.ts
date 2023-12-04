import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { sum } from "../../../../support/sequences";

export const scratchCards = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .tokenize(/[|:]/)
            .startLabeling()
            .label(e => e.n(), "id")
            .label(e => e.ns(), "win")
            .label(e => e.ns(), "mine")
            .run();

        let result = 0;
        for (const card of ns) {
            const matches = card.mine.filter(n => card.win.includes(n));
            const value = matches.length === 0 ? 0 : 2 ** (matches.length - 1);
            result += value;
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .tokenize(/[|:]/)
            .startLabeling()
            .label(e => e.n(), "id")
            .label(e => e.ns(), "win")
            .label(e => e.ns(), "mine")
            .run();

        const amounts = ns.map(() => 1);
        for (let i = 0; i < ns.length; i++) {
            const card = ns[i];
            const matches = card.mine.filter(n => card.win.includes(n));
            for (let delta = 1; delta <= matches.length; delta++) {
                amounts[i + delta] += amounts[i];
            }
        }
        await resultOutputCallback(sum(amounts));
    },
    {
        key: "scratch-cards",
        title: "Scratch Cards",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 4,
        stars: 2,
        exampleInput: `Card 1: 41 48 83 86 17 | 83 86  6 31 17  9 48 53
Card 2: 13 32 20 16 61 | 61 30 68 82 17 32 24 19
Card 3:  1 21 53 59 44 | 69 82 63 72 16 21 14  1
Card 4: 41 92 73 84 69 | 59 84 76 51 58  5 54 83
Card 5: 87 83 26 28 32 | 88 30 70 12 93 22 82 36
Card 6: 31 18 13 56 72 | 74 77 10 23 35 67 36 11`
    }
);