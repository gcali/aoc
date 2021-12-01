import wu from "wu";
import { MyIterable, sum } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

const countIncreasing = (data: Iterable<number>): number => {
        const result = new MyIterable(data).reduce({increases: 0, last: null as number | null}, (acc, next) => ({
            increases: acc.increases + (acc.last && next > acc.last ? 1 : 0),
            last: next
        }));
        return result.increases;
}

export const entry = entryForFile(
    async ({ lines, resultOutputCallback }) => {
        const data = lines.map(e => parseInt(e, 10));

        const result = countIncreasing(data);

        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const data = lines.map(e => parseInt(e, 10));

        const result = countIncreasing(new MyIterable(data).zip(data.slice(1)).zip(data.slice(2)).map(e => sum(e[0]) + e[1]));

        await resultOutputCallback(result);
    },
    {
        key: "key",
        title: "title",
        supportsQuickRunning: true,
        embeddedData: true
    }
);