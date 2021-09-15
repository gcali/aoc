import { entryForFile } from "../../entry";
import { Coordinate, CCoordinate, getBoundaries, Bounds, isInBounds } from "../../../support/geometry";

type Cell = "." | "|" | "~" | "#";

function scanLineToClay(line: string): CCoordinate[] {
    const [xs, ys] = line.split(", ").sort().map((e) => e.replace(/^.=/, "")).map(rangeToValues);

    return xs.flatMap((x) => ys.map((y) => new CCoordinate(x, y)));
}

class World {

    public get reachedCells(): number {
        return this.state.flatMap((row) => row.filter((e) => e === "|" || e === "~")).length;
    }
    public get dryCells(): number {
        return this.state.flatMap((row) => row.filter((e) => e === "~")).length;
    }
    public bounds: Bounds;
    private state: Cell[][];

    private readonly left = new CCoordinate(-1, 0);
    private readonly right = new CCoordinate(1, 0);
    private readonly down = new CCoordinate(0, 1);

    private interestingCoordinates: CCoordinate[] = [];
    public constructor(clayCells: CCoordinate[]) {
        this.bounds = getBoundaries(clayCells);
        this.bounds.topLeft.x -= 1;
        this.bounds.size.x += 2;
        this.state = new Array(this.bounds.size.y).fill(0).map((e) => new Array(this.bounds.size.x).fill("."));
        clayCells.forEach((c) => this.setCell(c, "#"));
    }

    public getCell(c: CCoordinate) {
        c = c.diff(this.bounds.topLeft);
        return this.state[c.y][c.x];
    }

    public setCell(c: CCoordinate, cell: Cell) {
        c = c.diff(this.bounds.topLeft);
        this.state[c.y][c.x] = cell;
    }

    public addWater(): boolean {
        const waterCoordinate = new CCoordinate(500, this.bounds.topLeft.y);
        this.setCell(waterCoordinate, "|");
        this.interestingCoordinates.push(waterCoordinate);
        return this.takeTurn();
    }


    public toString(): string {
        return this.state.map((e) => e.join("")).join("\n");
    }

    private takeTurn(): boolean {
        const oldWaterState = this.toString();
        for (const coordinate of this.interestingCoordinates) {

            const cell = this.getCell(coordinate);
            if (cell === "|") {
                const downer = coordinate.sum({ x: 0, y: 1 });
                if (downer.isInBounds(this.bounds)) {
                    const downerCell = this.getCell(downer);
                    if (downerCell === ".") {
                        this.setCell(downer, "|");
                        this.interestingCoordinates.push(downer);
                    } else if (downerCell === "~" || downerCell === "#") {
                        this.fillTowards(coordinate, this.left, "|");
                        this.fillTowards(coordinate, this.right, "|");
                        if (this.isStable(coordinate)) {
                            this.fillTowards(coordinate, this.left, "~");
                            this.fillTowards(coordinate, this.right, "~");
                            this.setCell(coordinate, "~");
                        }
                    }
                }
            }
        }

        //     }
        // }
        const newState = this.toString();
        return oldWaterState === newState;
    }

    private fillTowards(c: CCoordinate, direction: CCoordinate, fillWith: Cell): void {
        const current = this.getCell(c);
        if (current !== "|") {
            return;
        }
        const downer = this.down.sum(c);
        if (downer.isInBounds(this.bounds)) {
            const downerCell = this.getCell(downer);
            if (downerCell === "|" || downerCell === ".") {
                return;
            }
        } else {
            return;
        }
        const next = direction.sum(c);
        if (!next.isInBounds(this.bounds)) {
            return;
        } else {
            const nextCell = this.getCell(next);
            if (nextCell === ".") {
                this.setCell(next, fillWith);
                this.interestingCoordinates.push(next);
            }
            return this.fillTowards(next, direction, fillWith);
        }
    }

    private isClosedOn(c: Coordinate, direction: CCoordinate): boolean {
        const downer = this.down.sum(c);
        if (downer.isInBounds(this.bounds)) {
            const downerCell = this.getCell(downer);
            if (downerCell === "." || downerCell === "|") {
                return false;
            }
        } else {
            return false;
        }
        const next = direction.sum(c);
        if (!next.isInBounds(this.bounds)) {
            return false;
        } else {
            const nextCell = this.getCell(next);
            if (nextCell === "#") {
                return true;
            } else {
                return this.isClosedOn(next, direction);
            }
        }
    }

    private isStable(c: Coordinate): boolean {
        return this.isClosedOn(c, this.left) && this.isClosedOn(c, this.right);
    }



    private getStateSummary(): Array<[Cell, number]> {
        return this.state
            .flatMap((row) => row
                .map((c, index) => c === "|" || c === "~" ? [c, index] as [Cell, number] : null)
                .filter((e) => e !== null)) as Array<[Cell, number]>;
    }
}

function rangeToValues(exp: string): number[] {
    if (exp.indexOf("..") < 0) {
        return [parseInt(exp, 10)];
    } else {
        const [starts, ends] = exp.split("..").map((e) => parseInt(e, 10));
        return Array(ends - starts + 1).fill(0).map((e, index) => starts + index);
    }
}

export const entry = entryForFile(
    async ({ lines, outputCallback, pause }) => {
        const clayCoordinates = lines.flatMap(scanLineToClay);
        const world = new World(clayCoordinates);
        let done = false;
        let iteration = 0;
        while (!done) {
            done = world.addWater();
            if (++iteration % 10 === 0) {
                await outputCallback(world.toString(), true);
            } else {
                await pause();
            }
        }
        await outputCallback(world.reachedCells, true);
        await outputCallback(world.toString());
    },
    async ({ lines, outputCallback, pause }) => {
        const clayCoordinates = lines.flatMap(scanLineToClay);
        const world = new World(clayCoordinates);
        let done = false;
        let iteration = 0;
        while (!done) {
            done = world.addWater();
            if (++iteration % 100 === 0) {
                await outputCallback(world.toString(), true);
            } else {
                await pause();
            }
        }
        await outputCallback(world.dryCells, true);
        await outputCallback(world.toString());
    },
    { key: "reservoir-research", title: "Reservoir Research", stars: 2, embeddedData: "reservoir-research/reservoir-research"}
);
