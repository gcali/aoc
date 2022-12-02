import { PairingHeap } from "priorityqueue/lib/cjs";
import { buildGroupsFromSeparator } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";
import { buildVisualizer } from "./visualizer";

export type CalorieCountingData = number[][];

export const calorieCounting = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback, screen, pause }) => {
        const groups = [...buildGroupsFromSeparator(lines, e => e.trim().length === 0)]
            .map(g => g.map(e => parseInt(e, 10)));

        const visualizer = buildVisualizer(screen, pause);

        await visualizer.showOnScreen(groups);

        const groupTotals = groups.map(g => g.reduce((acc, next) => acc + next, 0));

        let max = {
            index: undefined as undefined | number,
            value: 0
        };

        for (let i = 0; i < groupTotals.length; i++) {
            await visualizer.setCurrent(i);
            if (groupTotals[i] > max.value) {
                max.value = groupTotals[i];
                if (max.index !== undefined) {
                    await visualizer.removeMax(max.index);
                }
                max.index = i;
                await visualizer.setMax(max.index);
            }
        }
        await visualizer.setCurrent(undefined);


        await resultOutputCallback(max.value);
    },
    async ({ lines, outputCallback, resultOutputCallback, screen, pause }) => {
        const groups = [...buildGroupsFromSeparator(lines, e => e.trim().length === 0)]
            .map(g => g.map(e => parseInt(e, 10)));

        const visualizer = buildVisualizer(screen, pause);

        await visualizer.showOnScreen(groups);

        const groupTotals = groups.map(g => g.reduce((acc, next) => acc + next, 0));

        type MyMax = {
            index: number,
            value: number
        };

        const heap = new PairingHeap<MyMax>({
            comparator: (a, b) => b.value - a.value
        });

        for (let i = 0; i < groupTotals.length; i++) {
            await visualizer.setCurrent(i);
            if (heap.length < 3 || heap.top().value < groupTotals[i]) {
                if (heap.length >= 3) {
                    const toRemove = heap.pop();
                    await visualizer.removeMax(toRemove.index);
                }
                heap.push({
                    index: i,
                    value: groupTotals[i]
                });
                await visualizer.setMax(i);
            }
        }
        await visualizer.setCurrent(undefined);

        const result = [
            heap.pop(),
            heap.pop(),
            heap.pop()
        ].reduce((acc, next) => acc + next.value, 0)

        await resultOutputCallback(result);
    },
    {
        key: "calorie-counting",
        title: "Calorie Counting",
        supportsQuickRunning: true,
        embeddedData: true,
        suggestedDelay: 10
    }
);