import wu from "wu";
import { MyAsyncIterable, MyIterable, sum } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";
import { seaBackground } from "../support/submarine";
import { buildVisualizer, ISonarSweepVisualizer } from "./visualizer";

const visualizerIncreasing = async (data: Iterable<number>, visualizer: ISonarSweepVisualizer): Promise<number> => {
    const result = MyAsyncIterable.fromIterable(data).windows(2).filter(async (e) => {
        const isIncreasing = e[1] > e[0];
        await visualizer.update(isIncreasing);
        return isIncreasing;
    }).count();
    return result;
};

const simpleIncreasing = (data: Iterable<number>): number =>
    new MyIterable(data).windows(2).filter((e) => e[1] > e[0]).count();

export const sonarSweep = entryForFile(
    async ({ lines, resultOutputCallback, screen, pause, mediaQuery }) => {

        const vs = buildVisualizer(screen, pause);
        const data = lines.map((e) => parseInt(e, 10));

        // visualization logic
        await vs.setup(data, mediaQuery);
        await vs.update(false);

        // actual logic
        const result = await visualizerIncreasing(data, vs);

        await resultOutputCallback(result);
    },
    async ({ lines, resultOutputCallback }) => {
        const data = lines.map((e) => parseInt(e, 10));

        const result = simpleIncreasing(
            new MyIterable(data)
                .zip(data.slice(1))
                .zip(data.slice(2))
                .map((e) => sum(e[0]) + e[1])
            );

        await resultOutputCallback(result);
    },
    {
        key: "sonar-sweep",
        title: "Sonar Sweep",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        suggestedDelay: 15,
        canvasBackground: seaBackground
    }
);
