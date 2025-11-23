import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput, smallExample, smallExampleTwo } from "./example";
import { UnknownSizeField } from "../../../../support/field";
import { CCoordinate, Coordinate, directions, manhattanDistance } from "../../../../support/geometry";

type Cell = "#" | "O" | "@" | "[" | "]";

type RawInstruction = "<" | "^" | "v" | ">";
type Instruction = CCoordinate;

const parseMap = (lines: string[]) => {
    const field = new UnknownSizeField<Cell>();
    for (let row = 0; row < lines.length; row++) {
        for (let col = 0; col < lines[row].length; col++) {
            const cell = lines[row][col];
            if (cell !== ".") {
                field.set({x: col, y: row}, cell as Cell);
            }
        }
    }
    return field;
}

const parseWideMap = (lines: string[]) => {
    const field = new UnknownSizeField<Cell>();
    for (let row = 0; row < lines.length; row++) {
        for (let col = 0; col < lines[row].length; col++) {
            const cell = lines[row][col];
            const toSet = [];
            if (cell === "#") {
                toSet.push("#");
                toSet.push("#");
            } else if (cell === "O") {
                toSet.push("[");
                toSet.push("]");
            } else if (cell === "@") {
                toSet.push("@");
            }
            for (let i = 0; i < toSet.length; i++) {
                field.set({x: col*2 + i, y: row}, toSet[i] as Cell);
            }
        }
    }
    return field;
}

const gpsValue = (c: Coordinate): number => {
    return c.x + (c.y*100);
}

class Warehouse {
    constructor(private readonly field: UnknownSizeField<Cell>, private readonly playerPosition: Coordinate) {
    }

    public toString() {
        return this.field.toMatrix().toString(e => e || ".");
    }

    public gpsValue(): number {
        let result = 0;
        for (const point of this.field.getPoints()) {
            if (point.e === "O" || point.e === "[") {
                result += gpsValue(point.c);
            }
        }
        return result;
    }

    public move(instruction: Instruction): Warehouse | null {
        const result = this.field.clone();
        const recursiveMove = (coordinate: Coordinate, direction: Instruction): boolean => {
            const currentCell = result.get(coordinate);
            if (currentCell === "#") {
                return false;
            } else if (!currentCell) {
                return true;
            } else if (currentCell === "@" || currentCell === "O") {
                const destinationCell = direction.sum(coordinate);
                if (!recursiveMove(destinationCell, direction)) {
                    return false;
                } else {
                    result.unset(coordinate);
                    result.set(destinationCell, currentCell);
                    return true;
                }
            } else if (currentCell === "[" || currentCell === "]") {
                if (direction.x < 0 || direction.x > 0) {
                    const destinationCell = direction.sum(coordinate);
                    if (!recursiveMove(destinationCell, direction)) {
                        return false;
                    } else {
                        result.unset(coordinate);
                        result.set(destinationCell, currentCell);
                        return true;
                    }
                } else {
                    const otherCoordinate = currentCell === "[" ? directions.right.sum(coordinate) : directions.left.sum(coordinate);
                    for (const toMove of [coordinate, otherCoordinate]) {
                        const currentCellToMove = result.get(toMove)!;
                        const destinationCell = direction.sum(toMove);
                        if (!recursiveMove(destinationCell, direction)) {
                            return false;
                        } else {
                            result.unset(toMove);
                            result.set(destinationCell, currentCellToMove);
                        }
                    }
                    return true;
                }
            } else {
                throw new Error("Should never get here");
            }
        }
        if (recursiveMove(this.playerPosition, instruction)) {
            return new Warehouse(result, instruction.sum(this.playerPosition));
        } else {
            return null;
        }
    }
}

const instructionDirections = [
    {d: directions.left, r: "<"},
    {d: directions.right, r: ">"},
    {d: directions.up, r: "^"},
    {d: directions.down, r: "v"},
]

const parseInstruction = (i: string): Instruction => {
    for (const e of instructionDirections) {
        if (e.r === i) {
            return e.d;
        }
    }
    throw new Error("Invalid direction " + i);
}

const serializeInstruction = (i: Instruction): string => {
    for (const e of instructionDirections) {
        if (manhattanDistance(e.d, i) === 0) {
            return e.r;
        }
    }
    throw new Error("Invalid direction " + i);
}

const parseInput = (lines: string[], mapParser: (s: string[]) => UnknownSizeField<Cell>): {warehouse: Warehouse, instructions: Instruction[]} => {
        const {instructions, map} = new Parser(lines)
            .group(e => e === "")
            .startSimpleLabeling()
            .label(e => mapParser(e), "map")
            .label(e => e.join("").split("").map(parseInstruction), "instructions")
            .run();
        const playerPosition = map.findOne(e => e === "@")!.c;
        let warehouse = new Warehouse(map, playerPosition);
        return {warehouse, instructions};
}

export const warehouseWoes = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        let {warehouse, instructions} = parseInput(lines, parseMap);
        for (const instruction of instructions) {
            const newWarehouse = warehouse.move(instruction)
            if (newWarehouse) {
                warehouse = newWarehouse;
            }
        }
        await outputCallback(warehouse.toString());
        await resultOutputCallback(warehouse.gpsValue());
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        let {warehouse, instructions} = parseInput(lines, parseWideMap);
        // await outputCallback("Initial state:");
        // await outputCallback(warehouse.toString());
        for (const instruction of instructions) {
            const newWarehouse = warehouse.move(instruction)
            // await outputCallback("");
            // await outputCallback(`Move ${serializeInstruction(instruction)}:`);
            if (newWarehouse) {
                warehouse = newWarehouse;
            //     await outputCallback(warehouse.toString());
            // } else {
            //     await outputCallback("Could not move");
            }
        }
        // await outputCallback(warehouse.toString());
        await resultOutputCallback(warehouse.gpsValue());
    },
    {
        key: "warehouse-woes",
        title: "Warehouse Woes",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 15,
        exampleInput: exampleInput,
        stars: 2
    }
);