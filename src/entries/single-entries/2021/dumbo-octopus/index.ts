import { getFullSurrounding, serialization } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { entryForFile } from "../../../entry";
import { buildVisualizer } from "./visualizer";

export const dumboOctopus = entryForFile(
    async ({ lines, resultOutputCallback, screen, pause }) => {
        const matrix = FixedSizeMatrix.fromSingleDigitInput(lines);

        const vs = buildVisualizer(screen, pause);
        await vs.setup(matrix.size);

        let totalFlashed = 0;

        await vs.update(matrix);

        for (let step = 0; step < 100; step++) {
            increment(matrix);
            const flashed = flash(matrix);

            await vs.update(matrix);

            totalFlashed += flashed.size;

            clear(matrix);

        }
        await resultOutputCallback(totalFlashed);
    },
    async ({ lines, screen, pause, resultOutputCallback }) => {
        const matrix = FixedSizeMatrix.fromSingleDigitInput(lines);

        const vs = buildVisualizer(screen, pause);
        await vs.setup(matrix.size);
        await vs.update(matrix);

        for (let step = 0; true; step++) {
            increment(matrix);
            const flashed = flash(matrix);

            await vs.update(matrix);

            if (flashed.size === matrix.size.x * matrix.size.y) {
                await resultOutputCallback(step + 1);
                return;
            }

            clear(matrix);
        }
    },
    {
        key: "dumbo-octopus",
        title: "Dumbo Octopus",
        supportsQuickRunning: true,
        embeddedData: true,
        suggestedDelay: 100,
        stars: 2
    }
);
function flash(matrix: FixedSizeMatrix<number>) {
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
                        if (matrix.get(n) !== undefined) {
                            matrix.set(n, matrix.get(n)! + 1);
                        }
                    }
                    found = true;
                }
            }
        });
    } while (found);
    return flashed;
}

function increment(matrix: FixedSizeMatrix<number>) {
    matrix.onEveryCellSync((c, e) => matrix.set(c, e! + 1));
}

function clear(matrix: FixedSizeMatrix<number>) {
    matrix.onEveryCellSync((c, e) => {
        if (e && e > 9) {
            matrix.set(c, 0);
        }
    });
}

