import { Bounds, CCoordinate, Coordinate, LiteralDirection, directions, getSurrounding, isInBounds, manhattanDistance, mapLiteralToDirection, rotate, serialization, sumCoordinate } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { entryForFile } from "../../../entry";
import { matrixSerializer } from "../../2018/mode-maze";

const exampleInput =
    `        ...#    
        .#..    
        #...    
        ....    
...#.......#    
........#...    
..#....#....    
..........#.    
        ...#....
        .....#..
        .#......
        ......#.

10R5L5R10L4R5L5`

type Connection = {
    a: { face: Bounds, direction: LiteralDirection },
    b: { face: Bounds, direction: LiteralDirection },
    isCross: boolean
};

class Connections {

    private readonly lookup: { [key: string]: { face: Bounds, direction: CCoordinate, isCross: boolean } } = {};

    constructor(
        lines: string[],
        private faces: Bounds[],
        private matrix: Field,
        private faceSize: number
    ) {
        const connections = Connections.parseConnections(lines, faces);
        for (const conn of connections) {
            const aKey = Connections.serialize(conn.a.face, conn.a.direction);
            if (this.lookup[aKey]) {
                throw new Error("Overriding " + aKey);
            }
            this.lookup[aKey] = {
                ...conn.b,
                direction: mapLiteralToDirection(conn.b.direction),
                isCross: conn.isCross
            };
            const bKey = Connections.serialize(conn.b.face, conn.b.direction);
            if (this.lookup[bKey]) {
                throw new Error("Overriding " + bKey);
            }
            this.lookup[bKey] = {
                ...conn.a,
                direction: mapLiteralToDirection(conn.a.direction),
                isCross: conn.isCross
            };
        }
        // console.log(Object.keys(this.lookup));
    }

    public getDestination(coordinate: Coordinate, direction: CCoordinate): { c: Coordinate, direction: CCoordinate } | null {
        const [face] = this.faces.filter(e => isInBounds(coordinate, e));
        if (!face) {
            throw new Error("Invalid coordinate");
        }
        const immediate = direction.sum(coordinate);
        if (isInBounds(immediate, face)) {
            const immediateCell = this.matrix.get(immediate);
            if (immediateCell === "#") {
                return null;
            } else if (immediateCell === ".") {
                return { c: immediate, direction };
            } else {
                throw new Error("Invalid coordinate after step");
            }
        }
        //wrapping
        const connection = this.lookup[Connections.serialize(face, direction)];
        // console.log(connection);
        if (!connection) {
            // console.error(face, direction);
            throw new Error("Can't find the connection");
        }
        const relativePosition = sumCoordinate(coordinate, { x: -face.topLeft.x, y: -face.topLeft.y });
        if ([relativePosition.x, relativePosition.y].every(e => e !== 0 && e !== this.faceSize - 1)) {
            throw new Error("Wrapping on invalid coordinate");
        }
        let index = 0;
        if (manhattanDistance(direction, directions.up) === 0 || manhattanDistance(direction, directions.down) === 0) {
            index = relativePosition.x;
        } else {
            index = relativePosition.y;
        }
        // console.log({index});
        let destinationPosition: Coordinate;
        let destinationDirection: CCoordinate;
        if (manhattanDistance(connection.direction, directions.up) === 0) {
            // console.log("Up!");
            destinationPosition = { ...connection.face.topLeft };
            destinationPosition.x += connection.isCross ? this.faceSize - 1 - index : index;
            destinationDirection = directions.down;
        } else if (manhattanDistance(connection.direction, directions.down) === 0) {
            // console.log("Down!");
            destinationPosition = { ...connection.face.topLeft };
            destinationPosition.y += connection.face.size.y - 1;
            destinationPosition.x += connection.isCross ? this.faceSize - 1 - index : index;
            destinationDirection = directions.up;
        } else if (manhattanDistance(connection.direction, directions.left) === 0) {
            // console.log("left!");
            destinationPosition = { ...connection.face.topLeft };
            destinationPosition.y += connection.isCross ? this.faceSize - 1 - index : index;
            destinationDirection = directions.right;
        } else if (manhattanDistance(connection.direction, directions.right) === 0) {
            // console.log("right!");
            destinationPosition = { ...connection.face.topLeft };
            destinationPosition.x += connection.face.size.x - 1;
            destinationPosition.y += connection.isCross ? this.faceSize - 1 - index : index;
            destinationDirection = directions.left;
        } else {
            throw new Error("Invalid connection direction");
        }
        if (this.matrix.get(destinationPosition) === "#") {
            return null;
        } else if (this.matrix.get(destinationPosition) !== ".") {
            throw new Error("Invalid destination cell: " + serialization.serialize(destinationPosition));
        }
        // console.log(destinationDirection);
        return { c: destinationPosition, direction: destinationDirection };
    }

    private static serialize(face: Bounds, direction: LiteralDirection | CCoordinate) {
        const cDirection = (typeof direction === "string") ? mapLiteralToDirection(direction) : direction;
        return `${serialization.serialize(face.topLeft)}_${serialization.serialize(cDirection)}`;
    }

    private static parseConnections(lines: string[], faces: Bounds[]): Connection[] {
        const res: Connection[] = [];
        for (const line of lines) {
            const aFace = parseInt(line[0], 10);
            const aDir = line[1];
            const bDir = line[2];
            const bFace = parseInt(line[3], 10);
            const isCross = line[4] === "x";
            res.push({
                a: {
                    face: faces[aFace],
                    direction: aDir as LiteralDirection
                },
                b: {
                    face: faces[bFace],
                    direction: bDir as LiteralDirection
                },
                isCross
            });
        }
        return res;
    }
}

type Field = FixedSizeMatrix<Cell>;


type Cell = undefined | "." | "#";
type Instruction = number | "L" | "R";

const directionValues = {
    [serialization.serialize(directions.right)]: 0,
    [serialization.serialize(directions.down)]: 1,
    [serialization.serialize(directions.left)]: 2,
    [serialization.serialize(directions.up)]: 3,
};

const parseInstructions = (line: string): Instruction[] => {
    const result: Instruction[] = [];
    let currentNumber = 0;
    for (const e of line) {
        const parsed = parseInt(e, 10);
        if (!isNaN(parsed)) {
            currentNumber *= 10;
            currentNumber += parsed;
        } else if (e === "L" || e === "R") {
            if (currentNumber > 0) {
                result.push(currentNumber);
                currentNumber = 0;
            }
            result.push(e);
        }
    }
    if (currentNumber > 0) {
        result.push(currentNumber);
    }
    return result;
}
export const monkeyMap = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        console.log(lines.join("\n").length);
        console.log({line: lines[0]});
        const matrixLines = lines.slice(0, lines.length - 2);
        const instructions = parseInstructions(lines[lines.length - 1]);
        const matrix = FixedSizeMatrix.fromLines(matrixLines, e => e === " " ? undefined : e as Cell);
        console.log(matrix.get({x:0,y:0}));
        console.log({cell: lines[0][0]});
        let currentPosition = { y: 0, x: 0 };
        let currentDirection = directions.right;
        while (matrix.get(currentPosition) === undefined) {
            currentPosition = directions.right.sum(currentPosition);
        }
        await outputCallback("Starting position: " + serialization.serialize(currentPosition));
        await outputCallback(matrix.toString(e => e || "X"));
        await outputCallback("Instructions parsed: " + (instructions.map(e => e.toString()).join("") === lines[lines.length - 1]));
        for (const instruction of instructions) {
            if (instruction === "L") {
                currentDirection = rotate(currentDirection, "Counterclockwise");
            } else if (instruction === "R") {
                currentDirection = rotate(currentDirection, "Clockwise");
            } else {
                for (let i = 0; i < instruction; i++) {
                    let candidatePosition = currentDirection.sum(currentPosition);
                    if (matrix.get(candidatePosition) === undefined) {
                        if (manhattanDistance(directions.right, currentDirection) === 0) {
                            candidatePosition.x = 0;
                        } else if (manhattanDistance(directions.left, currentDirection) === 0) {
                            candidatePosition.x = matrix.size.x - 1;
                        } else if (manhattanDistance(directions.up, currentDirection) === 0) {
                            candidatePosition.y = matrix.size.y - 1;
                        } else if (manhattanDistance(directions.down, currentDirection) === 0) {
                            candidatePosition.y = 0;
                        } else {
                            throw new Error("What direction is this? " + serialization.serialize(currentDirection));
                        }
                        while (matrix.get(candidatePosition) === undefined) {
                            candidatePosition = currentDirection.sum(candidatePosition);
                        }
                    }
                    if (matrix.get(candidatePosition) === "#") {
                        break;
                    } else if (matrix.get(candidatePosition) === ".") {
                        currentPosition = candidatePosition;
                    }
                }
            }
        }

        const finalPosition = sumCoordinate({ x: 1, y: 1 }, currentPosition);
        const directionValue = directionValues[serialization.serialize(currentDirection)];
        await outputCallback({ p: serialization.serialize(finalPosition), directionValue });
        await resultOutputCallback(finalPosition.y * 1000 + finalPosition.x * 4 + directionValue);

    },
    async ({ lines, isExample, resultOutputCallback, outputCallback, isQuickRunning }) => {
        const faceSize = isExample ? 4 : 50;

        const matrixLines = lines.slice(0, lines.length - 2);
        const instructions = parseInstructions(lines[lines.length - 1]);
        const matrix = FixedSizeMatrix.fromLines(matrixLines, e => e === " " ? undefined : e as Cell);

        const faceCorners: Bounds[] = [];

        await outputCallback(lines[0]);


        for (let x = 0; x < matrix.size.x; x += faceSize) {
            for (let y = 0; y < matrix.size.y; y += faceSize) {
                if (matrix.get({ x, y }) !== undefined) {
                    faceCorners.push({
                        topLeft: { x, y },
                        size: { x: faceSize, y: faceSize }
                    });
                }
            }
        }


        await outputCallback(faceCorners.length);
        await outputCallback(faceCorners.map(c => c.topLeft).map(serialization.serialize).join("\n"));

        if (!isQuickRunning) {
            const factor = isExample ? 1 : 10;

            const mapped = new FixedSizeMatrix<string>({ x: matrix.size.x / factor, y: matrix.size.y / factor });
            for (let nx = 0; nx < mapped.size.x; nx++) {
                for (let ny = 0; ny < mapped.size.y; ny++) {
                    const x = nx * factor;
                    const y = ny * factor;
                    let cell: string | undefined = undefined;
                    if (x % faceSize === 0 || x % faceSize === faceSize - 1) {
                        if (y % faceSize === 0 || (y % faceSize === faceSize - 1)) {
                            cell = "+";
                        } else {
                            cell = "|";
                        }
                    } else if (y % faceSize === 0 || (y % faceSize === faceSize - 1)) {
                        cell = "-";
                    }
                    for (let i = 0; i < faceCorners.length; i++) {
                        if (isInBounds({ x, y }, faceCorners[i])) {
                            cell = i.toString();
                        }
                    }
                    if (cell === undefined) {
                        cell = ".";
                    }
                    mapped.set({ x: nx, y: ny }, cell);

                }
            }

            await outputCallback(mapped.toString(e => e || "."));
        }

        const mappings = isExample ? [
            "0><1",
            "0^^2x",
            "0vv4x",
            "0<v5x",
            "1><3",
            "1^<2",
            "1v<4x",
            "3^v2",
            "3v^4",
            "3>^5x",
            "2>>5x",
            "4><5"
        ] : [
            "2><5",
            "2v^3",
            "2^<1",
            "2<<0x",
            "5v>3",
            "5>>4x",
            "5^v1",
            "3<^0",
            "3v^4",
            "4<>0",
            "4v>1",
            "0v^1"
        ];


        const connections = new Connections(mappings, faceCorners, matrix, faceSize);

        if (!isQuickRunning) {

            //test cases

            const inPlaceInstructions = ["", "L", "LL", "LLL"].map(e => e + (faceSize * 4).toString()).map(parseInstructions);

            const emptyMatrix = matrix.map((e, c) => e === "#" || e === "." ? "." : undefined);
            const emptyConnections = new Connections(mappings, faceCorners, emptyMatrix, faceSize);

            for (let x = 0; x < matrix.size.x; x++) {
                for (let y = 0; y < matrix.size.y; y++) {
                    if (emptyMatrix.get({ x, y }) !== ".") {
                        continue;
                    }
                    const startingPosition = { x, y };
                    const direction = directions.right;
                    for (const instruction of inPlaceInstructions) {
                        const testCase = `${serialization.serialize(startingPosition)}->${serialization.serialize(direction)}[${JSON.stringify(instruction)}]`;
                        const destination = executeInstructions(
                            instruction,
                            direction,
                            emptyConnections,
                            startingPosition
                        ).currentPosition;
                        if (manhattanDistance(startingPosition, destination) !== 0) {
                            throw new Error(`Test case failed: ${testCase}->${serialization.serialize(destination)}`);
                        }
                    }
                }
            }
        }

        let currentPosition = { y: 0, x: 0 };
        let currentDirection = directions.right;
        while (matrix.get(currentPosition) === undefined) {
            currentPosition = directions.right.sum(currentPosition);
        }
        await outputCallback("Starting position: " + serialization.serialize(currentPosition));

        ({ currentDirection, currentPosition } = executeInstructions(
            instructions,
            currentDirection,
            connections,
            currentPosition));

        await outputCallback(currentPosition);
        await outputCallback(currentDirection);

        const finalPosition = sumCoordinate({ x: 1, y: 1 }, currentPosition);
        const directionValue = directionValues[serialization.serialize(currentDirection)];
        await outputCallback({ p: serialization.serialize(finalPosition), directionValue });
        await resultOutputCallback(finalPosition.y * 1000 + finalPosition.x * 4 + directionValue);

    },
    {
        key: "monkey-map",
        title: "Monkey Map",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 22,
        exampleInput,
        fixedInput: true,
        stars: 2
    }
);

function executeInstructions(instructions: Instruction[], currentDirection: CCoordinate, connections: Connections, currentPosition: Coordinate) {
    for (const instruction of instructions) {
        if (typeof instruction === "string") {
            if (instruction === "L") {
                currentDirection = rotate(currentDirection, "Counterclockwise");
            } else {
                currentDirection = rotate(currentDirection, "Clockwise");
            }
        } else {
            for (let i = 0; i < instruction; i++) {
                const candidate = connections.getDestination(currentPosition, currentDirection);
                // console.log(JSON.stringify(candidate));
                if (candidate) {
                    currentPosition = candidate.c;
                    currentDirection = candidate.direction;
                } else {
                    break;
                }
            }
        }
    }
    return { currentDirection, currentPosition };
}
