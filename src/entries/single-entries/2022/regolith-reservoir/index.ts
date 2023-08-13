import { UnknownSizeField } from "../../../../support/field";
import { directions, isInBounds, manhattanDistance, sumCoordinate } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";

type Cell = "#" | "o";

export const regolithReservoir = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const field = new UnknownSizeField<Cell>();
        for (const line of lines) {
            const directions = line.split(" -> ").map(e => {
                const [x,y] = e.split(",").map(e => parseInt(e, 10));
                return {x,y};
            });
            for (let i = 1; i < directions.length; i++) {
                let from = directions[i-1];
                const to = directions[i];
                while (manhattanDistance(from, to) !== 0) {
                    field.set(from, "#");
                    from = {
                        x: from.x + Math.sign(to.x - from.x),
                        y: from.y + Math.sign(to.y - from.y)
                    };
                }
                field.set(to, "#");
            }
        }
        const bounds = field.getBoundaries();
        const startPoint = {x: 500, y: 0};
        let fellDown = false;
        while (!fellDown) {
            if (field.get(startPoint) !== null) {
                break;
            }
            let point = startPoint;
            while (true) {
                const candidates = [
                    sumCoordinate(directions.down, point),
                    sumCoordinate(directions.downLeft, point),
                    sumCoordinate(directions.downRight, point)
                ];
                const newPosition = candidates.find(e => field.get(e) === null);
                if (newPosition === undefined) {
                    break;
                }
                if (newPosition.y >= bounds.topLeft.y + bounds.size.y) {
                    fellDown = true;
                    break;
                }
                point = newPosition;
            }
            if (!fellDown) {
                field.set(point, "o");
            }
        }
        field.unset(startPoint);
        const matrix = field.toMatrix();
        await outputCallback(matrix.toString(e => e || "."));
        await resultOutputCallback(matrix.filter(e => matrix.get(e) === "o").length);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
//         lines =
// `498,4 -> 498,6 -> 496,6
// 503,4 -> 502,4 -> 502,9 -> 494,9`.split("\n");
        const field = new UnknownSizeField<Cell>();
        for (const line of lines) {
            const directions = line.split(" -> ").map(e => {
                const [x,y] = e.split(",").map(e => parseInt(e, 10));
                return {x,y};
            });
            for (let i = 1; i < directions.length; i++) {
                let from = directions[i-1];
                const to = directions[i];
                while (manhattanDistance(from, to) !== 0) {
                    field.set(from, "#");
                    from = {
                        x: from.x + Math.sign(to.x - from.x),
                        y: from.y + Math.sign(to.y - from.y)
                    };
                }
                field.set(to, "#");
            }
        }
        const bounds = field.getBoundaries();
        const startPoint = {x: 500, y: 0};
        while (true) {
            if (field.get(startPoint) !== null) {
                break;
            }
            let point = startPoint;
            while (true) {
                const candidates = [
                    sumCoordinate(directions.down, point),
                    sumCoordinate(directions.downLeft, point),
                    sumCoordinate(directions.downRight, point)
                ];
                const newPosition = candidates.find(e => field.get(e) === null);
                if (newPosition === undefined) {
                    break;
                }
                if (newPosition.y >= bounds.topLeft.y + bounds.size.y + 1) {
                    break;
                }
                point = newPosition;
            }
            field.set(point, "o");
        }
        const matrix = field.toMatrix();
        await outputCallback(matrix.toString(e => e || "."));
        await resultOutputCallback(matrix.filter(e => matrix.get(e) === "o").length);
    },
    {
        key: "regolith-reservoir",
        title: "Regolith Reservoir",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);