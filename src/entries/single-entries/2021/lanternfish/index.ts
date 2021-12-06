import { entryForFile } from "../../../entry";
import { buildVisualizer } from "./visualizer";

export type State = Array<{current: number; delayed: number}>;

export const lanternfish = entryForFile(
    async ({ lines, resultOutputCallback, screen, pause }) => {
        const ns = lines[0].split(",").map((l) => parseInt(l, 10));

        const vs = buildVisualizer(screen, pause);

        await vs.setup(false);

        let day = 0;
        const increases: Array<{current: number; delayed: number}> = [];
        for (let i = 0; i < 7; i++) {
            increases.push({current: 0, delayed: 0});
        }
        for (const n of ns) {
            increases[n].current++;
        }
        await vs.update(0, increases);
        while (day < 80) {
            const index = day % 7;
            increases[(day + 9) % 7].delayed += increases[index].current;
            increases[index].current += increases[index].delayed;
            increases[index].delayed = 0;
            day++;
            await vs.update(day, increases);
        }
        await resultOutputCallback(increases.reduce((acc, next) => acc + next.delayed + next.current, 0));
    },
    async ({ lines, resultOutputCallback, screen, pause }) => {
        const ns = lines[0].split(",").map((l) => parseInt(l, 10));

        const vs = buildVisualizer(screen, pause);

        await vs.setup(true);

        let day = 0;
        const increases: Array<{current: number; delayed: number}> = [];
        for (let i = 0; i < 7; i++) {
            increases.push({current: 0, delayed: 0});
        }
        for (const n of ns) {
            increases[n].current++;
        }
        await vs.update(0, increases);
        while (day < 256) {
            const index = day % 7;
            increases[(day + 9) % 7].delayed += increases[index].current;
            increases[index].current += increases[index].delayed;
            increases[index].delayed = 0;
            day++;
            await vs.update(day, increases);
        }
        await resultOutputCallback(increases.reduce((acc, next) => acc + next.delayed + next.current, 0));
    },
    {
        key: "lanternfish",
        title: "Lanternfish",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        suggestedDelay: 25
    }
);
