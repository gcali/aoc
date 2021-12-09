import { Queue } from "../../../../support/data-structure";
import { Coordinate, diffCoordinate, getBoundaries, getSurrounding, isInBounds, serialization } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { entryForFile } from "../../../entry";

const getLowPoints = (matrix: FixedSizeMatrix<number>): Array<{v: number, c: Coordinate}> => {
        const lowPoints: Array<{v: number, c: Coordinate}> = [];

        const bounds = getBoundaries([{x: 0, y: 0}, diffCoordinate(matrix.size, {x: -1, y: -1})]);

        matrix.onEveryCellSync((c, e) => {
            if (e === undefined) {
                return;
            }
            const surrounding = getSurrounding(c);
            let hasFoundAsLow = false;
            for (const s of surrounding) {
                if (isInBounds(s, bounds)) {
                    const v = matrix.get(s);
                    if (v !== undefined && v <= e) {
                        hasFoundAsLow = true;
                        break;
                    }
                }
            }
            if (!hasFoundAsLow) {
                lowPoints.push({v: e, c});
            }
        });

        return lowPoints;
};

export const smokeBasin = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const matrix = parseInput(lines);

        const lowPoints = getLowPoints(matrix);

        await resultOutputCallback(lowPoints.reduce((acc, next) => acc + next.v + 1, 0));
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const matrix = parseInput(lines);

        const lowPoints = getLowPoints(matrix);

        const basinCounts: number[] = [];

        for (const {c: lowPoint} of lowPoints) {
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
const  parseInput = (lines: string[]) => {
    const ns = lines.filter((l) => l).map((l) => l.split("").map((e) => parseInt(e, 10)));
    const matrix = new FixedSizeMatrix<number>({ x: lines[0].length, y: lines.length });
    for (let x = 0; x < matrix.size.x; x++) {
        for (let y = 0; y < matrix.size.y; y++) {
            matrix.set({ x, y }, ns[y][x]);
        }
    }
    return matrix;
};

