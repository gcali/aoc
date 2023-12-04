import { NotImplementedError } from "../../../../support/error";
import { directions, sumCoordinate } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { entryForFile } from "../../../entry";
import { seaBackground } from "../support/submarine";
import { buildVisualizer } from "./visualizer";

export type Cell = ">" | "v" | ".";

const move = (matrix: FixedSizeMatrix<Cell>, cellType: ">" | "v"):
    { result: FixedSizeMatrix<Cell>, hasMoved: boolean } => {
    let hasMoved = false;
    const result = new FixedSizeMatrix<Cell>(matrix.size);
    for (let x = 0; x < matrix.size.x; x++) {
        for (let y = 0; y < matrix.size.y; y++) {
            const current = matrix.getUnsafe({ x, y });
            if (current !== cellType) {
                if (result.get({ x, y }) === undefined) {
                    result.set({ x, y }, current);
                }
                continue;
            }
            const direction = current === ">" ? directions.right : directions.down;
            const rawNextC = sumCoordinate({ x, y }, direction);
            const nextC = {
                x: rawNextC.x % matrix.size.x,
                y: rawNextC.y % matrix.size.y
            };
            const destination = matrix.getUnsafe(nextC);
            if (destination === ".") {
                result.set({ x, y }, ".");
                result.set(nextC, current);
                hasMoved = true;
            } else {
                result.set({ x, y }, current);
            }
        }
    }

    return { result, hasMoved };

};

export const seaCucumber = entryForFile(
    async ({ lines, mediaQuery, screen, pause, resultOutputCallback, setAutoStop }) => {
        setAutoStop();
        const vs = buildVisualizer(screen, pause, mediaQuery);
        let matrix = parseInput(lines);

        await vs.setup(matrix.size);

        let steps = 0;


        while (true) {
            let hasMoved = false;
            for (const cellType of [">", "v"] as Array<"v" | ">">) {
                const {result: currentResult, hasMoved: currentHasMoved} = move(matrix, cellType);
                hasMoved = hasMoved || currentHasMoved;
                matrix = currentResult;
                await vs.show(matrix);
            }
            steps++;

            if (!hasMoved) {
                break;
            }
        }

        await resultOutputCallback(steps);

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        throw new NotImplementedError();
    },
    {
        key: "sea-cucumber",
        title: "Sea Cucumber",
        supportsQuickRunning: true,
        embeddedData: true,
        suggestedDelay: 1,
        stars: 2
        // customComponent: "pause-and-run"
    }
);

function parseInput(lines: string[]) {
    return FixedSizeMatrix.fromPlain(lines.map((l) => l.split("") as Cell[]));
}
