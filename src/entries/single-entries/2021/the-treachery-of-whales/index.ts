import { median } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

export const theTreacheryOfWhales = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = lines[0].split(",").map((l) => parseInt(l, 10));

        const target = median(ns);

        const costs = ns.map((x) => Math.abs(target - x));

        const sum = costs.reduce((acc, next) => acc + next, 0);

        await resultOutputCallback(sum);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = lines[0].split(",").map((l) => parseInt(l, 10));

        const max = ns.reduce((acc, next) => Math.max(acc, next));

        let bestCost = null as number | null;
        for (let i = 1; i <= max; i++)  {
            let cost = 0;
            for (const item of ns) {
                const delta = Math.abs(item - i);
                const currentCost = delta * (delta + 1) / 2;
                cost += currentCost;
            }
            if (!bestCost || cost < bestCost) {
                bestCost = cost;
            }
        }

        await resultOutputCallback(bestCost);
    },
    {
        key: "the-treachery-of-whales",
        title: "The Treachery of Whales",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);
