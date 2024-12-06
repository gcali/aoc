import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { CCoordinate, Coordinate, directions, manhattanDistance, rotate, serialization } from "../../../../support/geometry";
import { start } from "repl";

type Cell = "#" | "." | "^";

export const guardGallivant = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrix(parseCell);
        const grid = new Grid(ns, directions.up);
        const visited = grid.stepUntilOut();
        if (!visited) {
            throw new Error("Got in a loop");
        }
        await resultOutputCallback(visited.length);
    },
    async ({ lines, pause, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrix(parseCell);
        const getGrid = () => new Grid(ns, directions.up);
        const startingPosition = getGrid().currentPosition;
        const visited = getGrid().stepUntilOut();
        if (!visited) {
            throw new Error("Got in a loop with the starting input");
        }
        const obstacleCandidates = visited.filter(e => manhattanDistance(startingPosition, e) > 0);
        let result = 0;
        for (const obstacle of obstacleCandidates) {
            const localGrid = getGrid();
            localGrid.setObstacle(obstacle);
            const localVisited = localGrid.stepUntilOut();
            if (localVisited === null) {
                result++;
                await outputCallback(`Still running, this is a long one... got ${result} loops until now`, true);
                await pause();
            }
        }
        await resultOutputCallback(result);
    },
    {
        key: "guard-gallivant",
        title: "Guard Gallivant",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 6,
        exampleInput: exampleInput,
        stars: 2
    }
);

const validCells: Cell[] = ["#", ".", "^"];
const parseCell = (s: string): Cell => {
    if (!validCells.includes(s as Cell)) {
        throw new Error("Invalid cell: " + s);
    }
    return s as Cell;
}

type GuardMap = FixedSizeMatrix<Cell>;

class LoopError extends Error {
    kind = "loop";
}
class Grid {
    position: Coordinate;
    map: FixedSizeMatrix<Cell>;
    visited = new Set<string>();
    states = new Set<String>();

    constructor(map: GuardMap, private direction: CCoordinate) {
        const position = map.findOne(e => e === "^");
        if (!position) {
            throw new Error("Could not find guard");
        }
        const localMap = map.copy();
        localMap.set(position, ".");
        this.map = localMap;
        this.position = position;
        this.visited.add(serialization.serialize(this.position));
        this.trackState();
    }

    public stepUntilOut(): Coordinate[] | null {
        try {

            while (this.step()) {
            }
            const obstacleCandidates = this.visitedLocations;
            return obstacleCandidates;
        } catch (error: unknown) {

            const loopError = error as LoopError;
            if (loopError.kind === "loop") {
                return null;
            } else {
                throw error;
            }
        }
    }

    private trackState() {
        const newState = `${serialization.serialize(this.direction)}_${serialization.serialize(this.position)}`;
        if (this.states.has(newState)) {
            throw new LoopError();
        }
        this.states.add(newState);
    }

    private rotate() {
        this.direction = rotate(this.direction, "Clockwise");
    }

    public get howManyVisited(): number {
        return this.visited.size;
    }

    public get visitedLocations() {
        return [...this.visited.values()].map(serialization.deserialize);
    }

    public step(): boolean {
        const candidatePosition = this.direction.sum(this.position);
        const candidateDestination = this.map.get(candidatePosition);
        if (candidateDestination === ".") {
            this.position = candidatePosition;
            this.visited.add(serialization.serialize(candidatePosition));
            this.trackState();
            return true;
        } else if (!candidateDestination) {
            return false;
        } else {
            this.rotate();
            this.trackState();
            return true;
        }
    }

    public setObstacle(c: Coordinate) {
        this.map.set(c, "#");
    }

    public get currentPosition(): Coordinate {
        return this.position;
    }

}
