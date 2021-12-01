import wu from "wu";
import { MyAsyncIterable, MyIterable, sum } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";
import { buildVisualizer, ISonarSweepVisualizer } from "./visualizer";

const countIncreasing = async (data: Iterable<number>, visualizer: ISonarSweepVisualizer): Promise<number> => {
    const result = MyAsyncIterable.fromIterable(data).reduce({ increases: 0, last: null as number | null }, async (acc, next) => {
        const isIncreasing = acc.last !== null && next > acc.last;
        await visualizer.update(isIncreasing);
        return ({
            increases: acc.increases + (isIncreasing ? 1 : 0),
            last: next
        });
    });
    return (await result).increases;
}

export const entry = entryForFile(
    async ({ lines, resultOutputCallback, screen, pause }) => {

        const vs = buildVisualizer(screen, pause)
        const data = lines.map(e => parseInt(e, 10));

        vs.setup(data);

        const result = await countIncreasing(data, vs);

        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback, pause }) => {
        const vs = buildVisualizer(undefined, pause)
        const data = lines.map(e => parseInt(e, 10));

        const result = await countIncreasing(
            new MyIterable(data).zip(data.slice(1)).zip(data.slice(2)).map(e => sum(e[0]) + e[1]),
            vs
        );

        await resultOutputCallback(result);
    },
    {
        key: "sonar-sweep",
        title: "Sonar Sweep",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        suggestedDelay: 1
    }
);