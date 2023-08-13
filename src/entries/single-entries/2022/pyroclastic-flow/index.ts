import { UnknownSizeField } from "../../../../support/field";
import { CCoordinate, Coordinate, FullCoordinate, directions, sumCoordinate } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { entryForFile } from "../../../entry";

const exampleInput = ">>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>";

const shapes = [
"####",
`.#.
###
.#.`,
`..#
..#
###`,
`#
#
#
#`,
`##
##`
].map(shape => {
    const cells = shape.split("\n").map(line => line.split(""));
    const points: Coordinate[] = [];
    for (let y = 0; y < cells.length; y++) {
        for (let x = 0; x < cells[0].length; x++) {
            if (cells[y][x] === "#") {
                points.push({x: x + 2, y: y -cells.length - 2})
            }
        }
    }
    return points;
});

type Shape = Coordinate[];

class Tower {
    private readonly field: UnknownSizeField<"#"> = new UnknownSizeField<"#">();
    private shape: Shape | null = null;
    private currentHeight = 0;
    private currentPosition: CCoordinate = new CCoordinate(0, 0);

    areRowsEqual(a: number, b: number) {
        for (let x = 0; x < 7; x++) {
            if (this.field.get({x,y:a}) !== this.field.get({x,y:b})) {
                return false;
            }
        }
        return true;
    }

    areSectionsEqual(a: number, b: number, size: number) {
        for (let i = 0; i < size; i++) {
            if (!this.areRowsEqual(a-i, b-i)) {
                return false;
            }
        }
        return true;
    }

    add(shape: Shape) {
        this.shape = shape;
    }

    public get height() {
        return this.currentHeight;
    }

    move(direction: CCoordinate): boolean {
        if (!this.shape) {
            throw new Error("Cannot move without a shape");
        }
        const newPosition = direction.sum(this.currentPosition);
        if (this.checkIfValid(newPosition)) {
            this.currentPosition = newPosition;
        }
        //fall
        const fallPosition = directions.down.sum(this.currentPosition);
        if (this.checkIfValid(fallPosition)) {
            this.currentPosition = fallPosition;
            return true;
        }
        return false;
    }

    persist() {
        if (!this.shape) {
            throw new Error("Cannot persist without a shape");
        }
        const points = this.shape.map(p => this.currentPosition.sum(p));
        points.forEach(p => this.field.set(p, "#"));
        this.shape = null;
        this.currentPosition = new CCoordinate(0, Math.min(-this.currentHeight, Math.min(...points.map(p => p.y-1))))
        this.currentHeight = (-this.currentPosition.y);
    }

    private checkIfValid(newPosition: CCoordinate): boolean {
        if (!this.shape) {
            throw new Error("Cannot move without a shape");
        }
        const candidatePoints = this.shape.map(p => newPosition.sum(p));
        if (candidatePoints.every(p => p.x >= 0 && p.x < 7 && p.y <= 0 && this.field.get(p) !== "#")) {
            return true;
        }
        return false;
    }

    public toString(shadow: boolean): string {
        const maxHeight = shadow ? this.currentHeight + 6 : this.currentHeight;
        const matrix = new FixedSizeMatrix<"#" | "|" | "+" | "-" | "." | "@">({x: 9, y: maxHeight + 1});
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y <= maxHeight; y++) {
                if (x === 0 || x === 8) {
                    if (y === maxHeight) {
                        matrix.set({y,x}, "+");
                    } else {
                        matrix.set({y,x}, "|");
                    }
                } else if (y === maxHeight) {
                    matrix.set({y,x}, "-");
                } else {
                    matrix.set({y,x}, this.field.get({x: x -1, y: y - maxHeight + 1}) || ".");
                }
            }
        }
        if (shadow) {
            this.shape!.map(p => this.currentPosition.sum(p)).forEach(p  => matrix.set({x: p.x + 1, y: maxHeight - 1 + p.y}, "@"))
        }
        return matrix.toString(e => e || "X");
    }
}

const parseLines = (lines: string[]): CCoordinate[] => {
    return lines[0].split("").map(e => e === "<" ? directions.left : directions.right);
}

export const pyroclasticFlow = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const tower = new Tower();
        const rockTarget = 2022;
        let fallenRocks = 0;
        let directionIndex = 0;
        const input = parseLines(lines);
        while (fallenRocks < rockTarget) {
            tower.add(shapes[fallenRocks % shapes.length]);
            while (true) {
                const currentDirection = input[directionIndex];
                directionIndex = (directionIndex + 1) % input.length;
                if (!tower.move(currentDirection)) {
                    tower.persist();
                    break;
                }
            }
            fallenRocks++;
        }
        await outputCallback(tower.toString(false));
        await resultOutputCallback(tower.height);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const tower = new Tower();
        const rockTarget = 20220;
        let fallenRocks = 0;
        let directionIndex = 0;
        const input = parseLines(lines);
        const heights = [];
        while (fallenRocks < rockTarget) {
            tower.add(shapes[fallenRocks % shapes.length]);
            while (true) {
                const currentDirection = input[directionIndex];
                directionIndex = (directionIndex + 1) % input.length;
                if (!tower.move(currentDirection)) {
                    tower.persist();
                    break;
                }
            }
            fallenRocks++;
            heights.push(tower.height);
        }

        const heightDeltas: number[] = [];
        for (let i = 0; i < heights.length - 1; i++) {
            heightDeltas.push(heights[i+1]-heights[i]);
        }

        const candidateSize = 1000;

        const sameSequence = (a:number, b: number) => {
            for (let i = 0; i < candidateSize; i++) {
                if (heightDeltas[a+i] !== heightDeltas[b+i]) {
                    return false;
                }
            }
            return true;
        }

        const repetitions = {
            size: 0,
            base: 0
        };

        for (let base = 0; base < heightDeltas.length; base++) {
            for (let candidate = base+1; candidate < heightDeltas.length; candidate++) {
                if (sameSequence(base, candidate)) {
                    await outputCallback(`Found candidate, ${base}, ${candidate}`);
                    repetitions.size = candidate - base;
                    repetitions.base = base;
                    break;
                }
            }
            if (repetitions.size > 0) {
                break;
            }
        }

        await outputCallback("Repetitions: " + JSON.stringify(repetitions));

        const {base,size} = repetitions;

        let increase = 0;
        for (let i = 0; i < size; i++) {
            increase += heightDeltas[base+i];
        }

        const target = (1000000000000 - 1); //index is 0 based
        const myBase = target % size;
        const result = heights[myBase] + Math.floor(target/size) * increase;

        await resultOutputCallback(result);

    },
    {
        key: "pyroclastic-flow",
        title: "Pyroclastic Flow",
        supportsQuickRunning: true,
        embeddedData: true,
        exampleInput,
        stars: 2
    }
);