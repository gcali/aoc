import { Queue } from "../../../../support/data-structure";
import { Coordinate, diffCoordinate, getBoundaries, getSurrounding, isInBounds, serialization } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { entryForFile } from "../../../entry";

export const smokeBasin = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = lines.filter((l) => l).map((l) => l.split("").map((e) => parseInt(e, 10)));
        const matrix = new FixedSizeMatrix<number>({x: lines[0].length, y: lines.length});
        for (let x = 0; x < matrix.size.x; x++) {
            for (let y = 0; y < matrix.size.y; y++) {
                matrix.set({x, y}, ns[y][x]);
            }
        }

        let totalRisk = 0;

        const bounds = getBoundaries([{x: 0, y: 0}, diffCoordinate(matrix.size, {x: -1, y: -1})]);

        matrix.onEveryCellSync((c, e) => {
            if (e === undefined) {
                return;
            }
            const surrounding = getSurrounding(c);
            let hasFoundLower = false;
            for (const s of surrounding) {
                if (isInBounds(s, bounds)) {
                    const v = matrix.get(s);
                    if (v !== undefined && v <= e) {
                        hasFoundLower = true;
                        break;
                    }
                }
            }
            if (!hasFoundLower) {
                totalRisk += 1 + e;
            }
        });


        await resultOutputCallback(totalRisk);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = lines.filter((l) => l).map((l) => l.split("").map((e) => parseInt(e, 10)));
        const matrix = new FixedSizeMatrix<number>({x: lines[0].length, y: lines.length});
        for (let x = 0; x < matrix.size.x; x++) {
            for (let y = 0; y < matrix.size.y; y++) {
                matrix.set({x, y}, ns[y][x]);
            }
        }

        const bounds = getBoundaries([{x: 0, y: 0}, diffCoordinate(matrix.size, {x: -1, y: -1})]);

        const lowPoints: Coordinate[] = [];

        matrix.onEveryCellSync((c, e) => {
            if (e === undefined) {
                return;
            }
            const surrounding = getSurrounding(c);
            let hasFoundLower = false;
            for (const s of surrounding) {
                if (isInBounds(s, bounds)) {
                    const v = matrix.get(s);
                    if (v !== undefined && v <= e) {
                        hasFoundLower = true;
                        break;
                    }
                }
            }
            if (!hasFoundLower) {
                lowPoints.push(c);
            }
        });

        const basinCounts: number[] = [];

        for (const lowPoint of lowPoints) {
            let basinSize = 1;
            const visited = new Set<string>();
            const queue = new Queue<Coordinate>();
            queue.add(lowPoint);
            visited.add(serialization.serialize(lowPoint));

            while (!queue.isEmpty) {
                const current = queue.get()!;
                const value = matrix.get(current)!;
                const surrounding = getSurrounding(current);
                for (const s of surrounding) {
                    const sValue = matrix.get(s);
                    if (sValue !== undefined) {
                        if (sValue > value && sValue < 9) {
                            const serialized = serialization.serialize(s);
                            if (!visited.has(serialized)) {
                                visited.add(serialized);
                                basinSize++;
                                queue.add(s);
                            }
                        }
                    }
                }
            }
            basinCounts.push(basinSize);
        }

        const firstThree = basinCounts.sort((a, b) => b - a).slice(0, 3);

        await resultOutputCallback(firstThree.reduce((acc, next) => acc * next, 1));

    },
    {
        key: "smoke-basin",
        title: "Smoke Basin",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);
