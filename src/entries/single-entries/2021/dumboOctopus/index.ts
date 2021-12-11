import { getBoundaries, getFullSurrounding, isInBounds, serialization, sumCoordinate } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { entryForFile } from "../../../entry";
import { buildVisualizer } from "./visualizer";

export const dumboOctopus = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback, screen, pause }) => {
        const ns = lines.filter((l) => l.length > 0).map((line) => line.split("").map((e) => parseInt(e, 10)));
        const matrix = new FixedSizeMatrix<number>({ x: ns[0].length, y: ns.length });
        for (let x = 0; x < matrix.size.x; x++) {
            for (let y = 0; y < matrix.size.y; y++) {
                matrix.set({ x, y }, ns[y][x]);
            }
        }

        const vs = buildVisualizer(screen, pause);
        await vs.setup(matrix.size);

        let totalFlashed = 0;

        const boundaries = getBoundaries([{ x: 0, y: 0 }, sumCoordinate(matrix.size, { x: -1, y: -1 })]);
        await vs.update(matrix);

        for (let step = 0; step < 100; step++) {
            matrix.onEveryCellSync((c, e) => matrix.set(c, e! + 1));
            let found = false;
            const flashed = new Set<string>();
            do {
                found = false;
                matrix.onEveryCellSyncUnsafe((c, e) => {
                    if (e > 9) {
                        const s = serialization.serialize(c);
                        if (!flashed.has(s)) {
                            flashed.add(s);
                            const neighbours = getFullSurrounding(c);
                            for (const n of neighbours) {
                                if (!isInBounds(n, boundaries)) {
                                    continue;
                                }
                                if (matrix.get(n) !== undefined) {
                                    matrix.set(n, matrix.get(n)! + 1);
                                }
                            }
                            found = true;
                        }
                    }
                });
            } while (found);

            totalFlashed += flashed.size;

            await vs.update(matrix);

            matrix.onEveryCellSync((c, e) => {
                if (e && e > 9) {
                    matrix.set(c, 0);
                }
            });
        }
        await resultOutputCallback(totalFlashed);
    },
    async ({ lines, screen, pause, resultOutputCallback }) => {
        const ns = lines.filter((l) => l.length > 0).map((line) => line.split("").map((e) => parseInt(e, 10)));
        const matrix = new FixedSizeMatrix<number>({ x: ns[0].length, y: ns.length });
        for (let x = 0; x < matrix.size.x; x++) {
            for (let y = 0; y < matrix.size.y; y++) {
                matrix.set({ x, y }, ns[y][x]);
            }
        }


        const vs = buildVisualizer(screen, pause);
        await vs.setup(matrix.size);
        const boundaries = getBoundaries([{ x: 0, y: 0 }, sumCoordinate(matrix.size, { x: -1, y: -1 })]);
        await vs.update(matrix);

        for (let step = 0; true; step++) {
            console.log(matrix.toString((e) => e!.toString()));
            console.log("");
            matrix.onEveryCellSync((c, e) => matrix.set(c, e! + 1));
            let found = false;
            const flashed = new Set<string>();
            do {
                found = false;
                matrix.onEveryCellSync((c, e) => {
                    if (e && e > 9) {
                        const s = serialization.serialize(c);
                        if (!flashed.has(s)) {
                            flashed.add(s);
                            const neighbours = getFullSurrounding(c);
                            for (const n of neighbours) {
                                if (!isInBounds(n, boundaries)) {
                                    continue;
                                }
                                if (matrix.get(n) !== undefined) {
                                    matrix.set(n, matrix.get(n)! + 1);
                                }
                            }
                            found = true;
                        }
                    }
                });
            } while (found);

            await vs.update(matrix);

            if (flashed.size === matrix.size.x * matrix.size.y) {
                await resultOutputCallback(step + 1);
                return;
            }


            matrix.onEveryCellSync((c, e) => {
                if (e && e > 9) {
                    matrix.set(c, 0);
                }
            });
        }
    },
    {
        key: "dumbo-octopus",
        title: "Dumbo Octopus",
        supportsQuickRunning: true,
        embeddedData: true,
        suggestedDelay: 100
    }
);
