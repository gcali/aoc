import { BinaryHeap } from "priorityqueue/lib/cjs/BinaryHeap";
import { Coordinate, getSurrounding, scalarCoordinates } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { defaultSerializers } from "../../../../support/serialization";
import { entryForFile } from "../../../entry";

type QueueItem = { c: Coordinate, r: number };

class MyPriorityQueue extends BinaryHeap<QueueItem> {
    constructor() {
        super({ comparator: (a, b) => b.r - a.r });
    }

}

export const chiton = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const matrix = FixedSizeMatrix.fromSingleDigitInput(lines);
        const queue = new MyPriorityQueue();

        queue.push({ c: { x: 0, y: 0 }, r: 0! });

        const visited = new Set<string>();

        while (!queue.isEmpty()) {
            const item = queue.pop();
            if (item.c.x === matrix.size.x - 1 && item.c.y === matrix.size.y - 1) {
                await resultOutputCallback(item.r);
                return;
            }
            const serialized = defaultSerializers.coordinate2d.serialize(item.c);
            if (visited.has(serialized)) {
                continue;
            }
            visited.add(serialized);
            const ns = getSurrounding(item.c);
            for (const n of ns) {
                const risk = matrix.get(n);
                if (risk === undefined) {
                    continue;
                }
                queue.push({ c: n, r: risk + item.r });
            }
        }

        await resultOutputCallback("Failed");

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const oldMatrix = FixedSizeMatrix.fromSingleDigitInput(lines);
        const matrix = new FixedSizeMatrix<number>(scalarCoordinates(oldMatrix.size, 5));

        for (let x = 0; x < oldMatrix.size.x; x++) {
            for (let y = 0; y < oldMatrix.size.y; y++) {
                const r = oldMatrix.get({ x, y })!;
                for (let xM = 0; xM < 5; xM++) {
                    for (let yM = 0; yM < 5; yM++) {
                        const rawNewR = r + xM + yM;
                        const newR = (rawNewR - 1) % 9 + 1;
                        const c = { x: x + xM * oldMatrix.size.x, y: y + yM * oldMatrix.size.y };
                        matrix.set(c, newR);
                    }
                }
            }
        }

        const queue = new MyPriorityQueue();

        queue.push({ c: { x: 0, y: 0 }, r: 0! });

        const visited = new Set<string>();

        while (!queue.isEmpty()) {
            const item = queue.pop();
            if (item.c.x === matrix.size.x - 1 && item.c.y === matrix.size.y - 1) {
                await resultOutputCallback(item.r);
                return;
            }
            const serialized = defaultSerializers.coordinate2d.serialize(item.c);
            if (visited.has(serialized)) {
                continue;
            }
            visited.add(serialized);
            const ns = getSurrounding(item.c);
            for (const n of ns) {
                const risk = matrix.get(n);
                if (risk === undefined) {
                    continue;
                }
                queue.push({ c: n, r: risk + item.r });
            }
        }

        await resultOutputCallback("Failed");
    },
    {
        key: "chiton",
        title: "Chiton",
        supportsQuickRunning: true,
        embeddedData: true
    }
);
