import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { CCoordinate, Coordinate, directions, manhattanDistance } from "../../../../support/geometry";
import { optimizeCycles } from "../../../../support/optimization";

type Cell = "O" | "." | "#";
type Grid = FixedSizeMatrix<Cell>;

const findNewPosition = (grid: Grid, position: Coordinate, direction: CCoordinate): Coordinate => {
    if (grid.get(position) !== "O") {
        throw new Error("Cannot move: " + position);
    }
    let newPosition = direction.sum(position);
    while (grid.get(newPosition) === ".") {
        newPosition = direction.sum(newPosition);
    }
    return direction.opposite.sum(newPosition);
}

export const parabolicReflectorDish = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrix(e => e as Cell);
        roll(ns, directions.up);
        const load = calculateLoad(ns);
        await resultOutputCallback(load);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const cycle = [
            directions.up,
            directions.left,
            directions.down,
            directions.right
        ];
        const ns = new Parser(lines)
            .matrix(e => e as Cell);
        const iterations = 1000000000;
            const res = optimizeCycles(
                ns,
                iterations,
                e => `${e.simpleSerialize()}`,
                (ns) => {
                    for (const direction of cycle) {
                        roll(ns, direction);
                    }
                    return [ns, calculateLoad(ns)];
                }
            )
        await resultOutputCallback(res);
    },
    {
        key: "parabolic-reflector-dish",
        title: "Parabolic Reflector Dish",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 14,
        stars: 2,
        exampleInput: `O....#....
O.OO#....#
.....##...
OO.#O....O
.O.....O#.
O.#..O.#.#
..O..#O..O
.......O..
#....###..
#OO..#....`
    }
);

function roll(ns: FixedSizeMatrix<Cell>, direction: CCoordinate): Grid {
    if (manhattanDistance(directions.up, direction) === 0) {
        for (let y = 0; y < ns.size.y; y++) {
            for (let x = 0; x < ns.size.x; x++) {
                updatePosition(x, y);
            }
        }
    } else if (manhattanDistance(directions.down, direction) === 0) {
        for (let y = ns.size.y-1; y >= 0; y--) {
            for (let x = 0; x < ns.size.x; x++) {
                updatePosition(x, y);
            }
        }
    } else if (manhattanDistance(directions.left, direction) === 0) {
        for (let x = 0; x < ns.size.x; x++) {
            for (let y = 0; y < ns.size.y; y++) {
                updatePosition(x, y);
            }
        }
    } else if (manhattanDistance(directions.right, direction) === 0) {
        for (let x = ns.size.x-1; x >= 0; x--) {
            for (let y = 0; y < ns.size.y; y++) {
                updatePosition(x, y);
            }
        }
    }
    return ns;

    function updatePosition(x: number, y: number) {
        if (ns.get({ x, y }) === "O") {
            const newPosition = findNewPosition(ns, { x, y }, direction);
            ns.set({ x, y }, ".");
            ns.set(newPosition, "O");
        }
    }
}

function calculateLoad(ns: FixedSizeMatrix<Cell>) {
    return ns.reduce((acc, next) => {
        const { cell, coordinate } = next;
        if (cell === "O") {
            return acc + ns.size.y - coordinate.y;
        } else {
            return acc;
        }
    }, 0);
}
