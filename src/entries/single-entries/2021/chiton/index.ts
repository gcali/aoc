import { BinaryHeap } from "priorityqueue/lib/cjs/BinaryHeap";
import { Coordinate, getSurrounding, isInBounds, scalarCoordinates } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { defaultSerializers } from "../../../../support/serialization";
import { entryForFile } from "../../../entry";

type QueueItem = { c: Coordinate, r: number };

class MyPriorityQueue extends BinaryHeap<QueueItem> {
    constructor() {
        super({ comparator: (a, b) => b.r - a.r });
    }

}

const getBestCost = (lines: string[], factor: number): number => {
    const matrix = FixedSizeMatrix.fromSingleDigitInput(lines);

    const boundaries = { topLeft: { x: 0, y: 0 }, size: scalarCoordinates(matrix.size, factor) };

    const queue = new MyPriorityQueue();

    queue.push({ c: { x: 0, y: 0 }, r: 0 });

    const visited = new Set<string>();

    while (!queue.isEmpty()) {
        const item = queue.pop();
        if (item.c.x === matrix.size.x * factor - 1 && item.c.y === matrix.size.y * factor - 1) {
            return item.r;
        }
        const serialized = defaultSerializers.coordinate2d.serialize(item.c);
        if (visited.has(serialized)) {
            continue;
        }
        visited.add(serialized);
        const ns = getSurrounding(item.c);
        for (const n of ns) {
            if (!isInBounds(n, boundaries)) {
                continue;
            }
            const c = {
                x: n.x % matrix.size.x,
                y: n.y % matrix.size.y
            };

            const xFactor = Math.floor(n.x / matrix.size.x);
            const yFactor = Math.floor(n.y / matrix.size.y);

            const risk = matrix.get(c);
            if (risk === undefined) {
                throw new Error("I'm sad :(");
            }
            const modifiedRisk = (risk + xFactor + yFactor - 1) % 9 + 1;
            queue.push({ c: n, r: modifiedRisk + item.r });
        }
    }

    throw new Error("Failed");
};

export const chiton = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        await resultOutputCallback(getBestCost(lines, 1));

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        await resultOutputCallback(getBestCost(lines, 5));
    },
    {
        key: "chiton",
        title: "Chiton",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);
