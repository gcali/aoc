import { buildGroupsFromSeparator } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

export const calorieCounting = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const groups = [...buildGroupsFromSeparator(lines, e => e.trim().length === 0)]
            .map(g => g.map(e => parseInt(e, 10)));
        const max = groups.map(g => g.reduce((acc, next) => acc + next, 0)).reduce((acc, next) => Math.max(acc, next), 0);
        await resultOutputCallback(max);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const groups = [...buildGroupsFromSeparator(lines, e => e.trim().length === 0)]
            .map(g => g.map(e => parseInt(e, 10)));
        const sums = groups.map(e => e.reduce((acc, next) => acc + next, 0)).sort((a, b) => b - a);
        const top = sums.slice(0, 3);
        const total = top.reduce((acc, next) => acc + next, 0)

        await resultOutputCallback(total);
    },
    {
        key: "calorie-counting",
        title: "Calorie Counting",
        supportsQuickRunning: true,
        embeddedData: true
    }
);