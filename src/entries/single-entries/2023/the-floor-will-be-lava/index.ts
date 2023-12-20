import { OutputCallback, Pause, entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { CCoordinate, Coordinate, directions, rotate, serialization } from "../../../../support/geometry";
import { Lifo, Queue, SerializableSet } from "../../../../support/data-structure";
import { start } from "repl";

const validCells = ["|", "\\", "/", "-", "-", "."] as const;

type Cell = {
    cell: typeof validCells[number]
    directions: CCoordinate[];
}

type Grid = FixedSizeMatrix<Cell>;

type Vector = {
    position: Coordinate;
    direction: CCoordinate;
}

const visited = new SerializableSet<Coordinate>(serialization);
const vectorVisited = new SerializableSet<Vector>({
    serialize(e) {
    return `${serialization.serialize(e.position)}_${serialization.serialize(e.direction)}`;
}, 
deserialize(e) {
    const [position, direction] = e.split("_").map(e => serialization.deserialize(e));
    return {position, direction: new CCoordinate(direction.x, direction.y)};
}}
);

const nextStep = (vector: Vector, grid: Grid) : Vector[] => {
    const existingCell = grid.get(vector.position);
    if (existingCell) {
        if (existingCell.directions.some(d => d.is(vector.direction))) {
            return [];
        }
        existingCell.directions.push(vector.direction);
    }

    const newPosition = vector.direction.sum(vector.position);
    const cell = grid.get(newPosition);
    if (!cell) {
        return [];
    }
    const resultDirections: CCoordinate[] = [];
    if (cell.cell === "/") {
        const rotation = vector.direction.y !== 0 ? "Clockwise" : "Counterclockwise";
        resultDirections.push(rotate(vector.direction, rotation));
    } else if (cell.cell === "\\") {
        const rotation = vector.direction.x !== 0 ? "Clockwise" : "Counterclockwise";
        resultDirections.push(rotate(vector.direction, rotation));
    } else if (cell.cell === "|" && vector.direction.x !== 0) {
        resultDirections.push(directions.up);
        resultDirections.push(directions.down);
    } else if (cell.cell === "-" && vector.direction.y !== 0) {
        resultDirections.push(directions.left);
        resultDirections.push(directions.right);
    } else {
        resultDirections.push(vector.direction);
    }
    return resultDirections.map(d => ({
        position: newPosition,
        direction: d
    }));
}

export const theFloorWillBeLava = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback, pause }) => {
        const ns = new Parser(lines)
            .matrix(e => {
                if (!(validCells as unknown as string[]).includes(e)) {
                    throw new Error("Invalid cell");
                }
                return {
                    cell: e,
                    directions: []
                } as Cell;
            });
        const startingBeam: Vector = {
            position: {x: -1, y: 0},
            direction: directions.right
        };
        const energized = await calculateEnergized(startingBeam, outputCallback, ns, pause);
        await resultOutputCallback(energized);

    },
    async ({ lines, outputCallback, resultOutputCallback, pause}) => {
        const ns = new Parser(lines)
            .matrix(e => {
                if (!(validCells as unknown as string[]).includes(e)) {
                    throw new Error("Invalid cell");
                }
                return {
                    cell: e,
                    directions: []
                } as Cell;
            });
        const startingBeams: Vector[] = [];
        for (let x = 0; x < ns.size.x; x++) {
            startingBeams.push({position: {x, y:-1}, direction: directions.down});
            startingBeams.push({position: {x, y:ns.size.y}, direction: directions.up});
        }
        for (let y = 0; y < ns.size.y; y++) {
            startingBeams.push({position: { x: -1, y }, direction: directions.right});
            startingBeams.push({position: { x: ns.size.x, y }, direction: directions.left});
        }
        let best = 0;
        for (const startingBeam of startingBeams) {
            const energized = await calculateEnergized(startingBeam, async () => {}, ns, async () => {});
            await pause(0);
            best = Math.max(energized, best);
        }
        await resultOutputCallback(best);
    },
    {
        key: "the-floor-will-be-lava",
        title: "The Floor Will Be Lava",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 16,
        stars: 2,
        // customComponent: "pause-and-run",
        exampleInput: 
`.|...\\....
|.-.\\.....
.....|-...
........|.
..........
.........\\
..../.\\\\..
.-.-/..|..
.|....-|.\\
..//.|....`
    }
);

async function calculateEnergized(startingBeam: Vector, outputCallback: OutputCallback, ns: FixedSizeMatrix<Cell>, pause: Pause) {
    let beams: Vector[] = [startingBeam];
    while (beams.length > 0) {
        await outputCallback(null, true);
        await outputCallback(ns.toString(e => {
            return e!.directions.length > 0 ? "#" : e!.cell;
        }));
        await pause();
        const newBeams: Vector[] = [];
        for (const beam of beams) {
            const additionals = nextStep(beam, ns);
            newBeams.push(...additionals);
        }
        beams = newBeams;
    }
    const energized = ns.getFlatData().filter(c => c.directions.length > 0).length;
    ns.getFlatData().forEach(e => e.directions = []);
    return energized;
}
