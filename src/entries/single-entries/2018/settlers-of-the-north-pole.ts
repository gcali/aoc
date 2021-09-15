import { entryForFile } from "../../entry";
import { FixedSizeMatrix } from "../../../support/matrix";
import { CCoordinate, Coordinate, directions, directionList } from "../../../support/geometry";

import wu from "wu";

type Cell = "." | "|" | "#";

function isCell(s: string): s is Cell {
    return s === "." || s === "|" || s === "#";
}

interface WorldConstructor {
    cells?: Cell[][];
    data?: FixedSizeMatrix<Cell>;
    minute: number;
}

const worldStates = new Set<string>();
const worldStateList: string[] = [];
const worldStateMap = new Map<string, World>();
let worldStateLoop: string[] = [];

class World {

    public get resourceValue(): number {
        let lumberTally = 0;
        let treeTally = 0;
        const interesting = this.data.data.forEach((e) => {
            if (e === "|") {
                treeTally++;
            } else if (e === "#") {
                lumberTally++;
            }
        });
        return lumberTally * treeTally;
    }

    public static fromLines(lines: string[]): World {
        return new World({
            cells: lines.map((line) => line.split("").map((e) => isCell(e) ? e : ".")),
            minute: 0
        });
    }
    public minute: number;
    private size: CCoordinate;
    private data: FixedSizeMatrix<Cell>;
    private constructor({ cells, data, minute }: WorldConstructor) {
        this.minute = minute;
        if (cells) {
            this.size = new CCoordinate(cells[0].length, cells.length);
            this.data = new FixedSizeMatrix<Cell>(this.size);
            for (let x = 0; x < this.size.x; x++) {
                for (let y = 0; y < this.size.y; y++) {
                    this.data.set({ x, y }, cells[y][x]);
                }
            }
        } else if (data) {
            this.size = new CCoordinate(data.size.x, data.size.y);
            this.data = data;
        } else {
            throw Error();
        }
    }

    public takeTurns(howMany: number): World {
        let world: World = this;
        if (worldStateLoop.length > 0) {
            // alert("Loop length: " + worldStateLoop.length);
            const loopBaseIndex = worldStateLoop.indexOf(this.toString());
            const targetIndex = (loopBaseIndex + howMany) % worldStateLoop.length;
            // worldStateLoop.map((l) => worldStateMap.get(l)!.resourceValue).forEach((e) => console.log(e));
            return worldStateMap.get(worldStateLoop[targetIndex])!;
        }
        while (howMany-- > 0) {
            const newWorld = new World({ data: world.data.copy(), minute: world.minute + 1 });
            for (let x = 0; x < world.size.x; x++) {
                for (let y = 0; y < world.size.y; y++) {
                    const adjacents = Array.from(world.adjacent({ x, y }));
                    const oldCell = world.data.get({ x, y })!;
                    newWorld.data.set({ x, y }, this.calculateNew(oldCell, adjacents));
                }
            }
            world = newWorld;
            const state = world.toString();
            if (worldStates.has(state)) {
                worldStateLoop = worldStateList.slice(worldStateList.indexOf(state));
                return world.takeTurns(howMany);
            } else {
                worldStates.add(state);
                worldStateList.push(state);
                worldStateMap.set(state, world);
            }

        }
        return world;
    }

    public toString() {
        return wu(this.data.overRows()).map((row) => row.join("")).toArray().join("\n");
    }

    private calculateNew(old: Cell, adjacents: Cell[]): Cell {
        switch (old) {
            case ".":
                if (adjacents.filter((e) => e === "|").length >= 3) {
                    return "|";
                }
                return ".";
            case "|":
                if (adjacents.filter((e) => e === "#").length >= 3) {
                    return "#";
                }
                return "|";
            case "#":
                if (adjacents.filter((e) => e === "#").length >= 1 && adjacents.filter((e) => e === "|").length >= 1) {
                    return "#";
                }
                return ".";
        }
    }

    private *adjacent(c: Coordinate): Iterable<Cell> {
        for (const direction of directionList) {
            if (direction.sum(c).isInBounds(this.size)) {
                yield this.data.get(direction.sum(c))!;
            }
        }
    }
}


export const entry = entryForFile(
    async ({ lines, outputCallback, isCancelled, pause }) => {
        let world = World.fromLines(lines);
        await outputCallback(["Initial state", world.toString()]);
        let iteration = 1;
        while (!isCancelled!()) {
            world = world.takeTurns(1);
            await outputCallback([`Minute ${iteration++}`, world.toString(), world.resourceValue], true);
            await pause();
        }
    },
    async ({ lines, outputCallback, pause, isCancelled }) => {
        const world = World.fromLines(lines);
        await outputCallback(["Initial state", world.toString()]);
        const iteration = 1;
        const target = 1000000000;
        const newWorld = world.takeTurns(target);
        await outputCallback([newWorld.resourceValue, newWorld.toString()], true);
        // const turnsPerIteration = 5000;
        // while (!isCancelled!()) {
        //     let subIteration = 0;
        //     const perSub = 10;
        //     while (perSub * subIteration < turnsPerIteration) {
        //         world = world.takeTurns(perSub);
        //         await pause();
        //         subIteration++;
        //     }
        //     await outputCallback([
        //         `Minute ${iteration * turnsPerIteration}/${target}`,
        //         `${iteration * turnsPerIteration / target}`,
        //         world.toString(),
        //         world.resourceValue
        //     ], true);
        //     iteration++;
        // }
    },
    {
        key: "settlers-of-the-north-pole",
        title: "Settlers of the North Pole",
        stars: 2,
        customComponent: "pause-and-run",
        embeddedData: "settlers-of-the-north-pole/input"
    }
);
