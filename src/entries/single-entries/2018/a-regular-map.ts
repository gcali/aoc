import { entryForFile } from "../../entry";
import { NotImplementedError } from "../../../support/error";
import { CCoordinate, directions, manhattanDistance, Coordinate, ascendingCompare } from "../../../support/geometry";
import { UnknownSizeField } from "../../../support/field";
import { FixedSizeMatrix } from "../../../support/matrix";
import { calculateDistances } from "../../../support/labyrinth";

type DirectionGroup = Directions[];
type Directions = Array<string | DirectionGroup>;

const parseGroup = (line: string, index: number): [DirectionGroup, number] => {
    const groups: string[] = [];
    let currentGroup: string[] = [];
    index++;
    let openCount = 0;
    while (index < line.length) {
        const currentChar = line[index];
        if (openCount > 0) {
            currentGroup.push(line[index]);
            if (currentChar === "(") {
                openCount++;
            } else if (currentChar === ")") {
                openCount--;
            }
        } else {
            if (currentChar === "(") {
                openCount++;
                currentGroup.push(currentChar);
            } else if (currentChar === ")") {
                break;
            } else if (currentChar === "|") {
                groups.push(currentGroup.join(""));
                currentGroup = [];
            } else {
                currentGroup.push(currentChar);
            }
        }
        index++;
    }
    if (line[index] !== ")") {
        throw new Error("Error while parsing, group not ended");
    }
    groups.push(currentGroup.join(""));
    return [groups.map((group) => parse(group)), index];
};

const isGroup = (d: (string | DirectionGroup)): d is DirectionGroup => {
    return Array.isArray(d);
};

// if (stateCache) {
//     const serializedCoordinate = serializeCoordinate(state);
//     const serializedGroup = serializeDirectionGroup(firstElement);
//     if (stateCache.has(serializedCoordinate)) {
//         const directionCache = stateCache.get(serializedCoordinate)!;
//         if (directionCache.has(serializedGroup)) {
//             console.log("Found in cache!");
//             const states = directionCache.get(serializedGroup)!;
//             for (const state of states) {
//                 await visitCallback(null, state);
//             }
//             return;
//         }
//     }
// }

// if (stateCache) {
//     if (!stateCache.has(serializedCoordinate)) {
//         stateCache.set(serializedCoordinate, new Map<string, Coordinate[]>());
//     }
//     stateCache.get(serializedCoordinate)!.set(serializedGroup, states);
// }

const bfsVisit = async <T>(
    dirs: Directions,
    index: number,
    visitCallback: (token: string | null, state: T) => Promise<T>,
    argState: T,
    areStateEqual?: (a: T, b: T) => boolean,
): Promise<void> => {
    if (index >= dirs.length) {
        await visitCallback(null, argState);
        return;
    }
    const firstElement = dirs[index];
    if (isGroup(firstElement)) {
        let states: T[] = [];
        for (const group of firstElement) {
            await bfsVisit(group, 0, async (token, state) => {
                const resultState = await visitCallback(token, state);
                if (token === null) {
                    states.push(resultState);
                }
                return resultState;
            }, argState, areStateEqual);
        }
        if (areStateEqual) {
            states = deduplicateStates(states, areStateEqual);
        }
        for (const s of states) {
            await bfsVisit(dirs, index + 1, visitCallback, s, areStateEqual);
        }
    } else {
        await bfsVisit(dirs, index + 1, visitCallback, await visitCallback(firstElement, argState), areStateEqual);
    }
};

const deduplicateStates = <T, >(states: T[], areStatesEqual: (a: T, b: T) => boolean): T[] => {
    for (let i = 0; i < states.length; i++) {
        const toKeep = states[i];
        states = states.filter((e, index) => index <= i || !areStatesEqual(toKeep, e));
    }
    return states;
};

const dfsVisit = async <T>(
    dirs: Directions,
    visitCallback: (token: string | null, state: T) => Promise<T>,
    argState: T
): Promise<void> => {
    if (dirs.length === 0) {
        await visitCallback(null, argState);
        return;
    }
    const firstElement = dirs[0];
    if (isGroup(firstElement)) {
        for (const group of firstElement) {
            await dfsVisit(group, async (token, state) => {
                if (token === null) {
                    await dfsVisit(dirs.slice(1), visitCallback, state);
                    return state;
                }
                return await visitCallback(token, state);
            }, argState);
        }
    } else {
        await dfsVisit(dirs.slice(1), visitCallback, await visitCallback(firstElement, argState));
    }
};

const parse = (line: string): Directions => {
    if (line.startsWith("^")) {
        line = line.slice(1);
    }
    if (line.endsWith("$")) {
        line = line.slice(0, -1);
    }
    let i = 0;
    const dirs: Directions = [];
    while (i < line.length) {
        if (line[i] !== "(") {
            dirs.push(line[i]);
        } else {
            const [group, endIndex] = parseGroup(line, i);
            i = endIndex;
            dirs.push(group);
        }
        i++;
    }
    return dirs;
};

const directionMapper = (a: string): CCoordinate => {
    switch (a.toUpperCase()) {
        case "W":
            return directions.left;
        case "E":
            return directions.right;
        case "N":
            return directions.up;
        case "S":
            return directions.down;
        default:
            throw new Error("Invalid direction " + a);
    }
};

interface Door {
    from: Coordinate;
    to: Coordinate;
}

const toRoomCoordinates = (coordinate: Coordinate): Coordinate => {
    return {
        x: coordinate.x * 2,
        y: coordinate.y * 2
    };
};

const buildRoom = (field: UnknownSizeField<"#">, doors: Door[]): FixedSizeMatrix<string> => {
    const baseMatrix = field.toMatrix();
    const resultMatrix = new FixedSizeMatrix<string>({ x: baseMatrix.size.x * 2 + 1, y: baseMatrix.size.y * 2 + 1 });
    resultMatrix.fill("#");
    resultMatrix.setDelta(baseMatrix.delta.sum(baseMatrix.delta).sum({ x: -1, y: -1 }));
    baseMatrix.onEveryCell((coordinate, cell) => {
        if (cell) {
            resultMatrix.set(toRoomCoordinates(coordinate), ".");
        }
    }
    );
    doors.forEach((door) => {
        const from = toRoomCoordinates(door.from);
        const to = toRoomCoordinates(door.to);
        const dx = (to.x - from.x) / 2;
        const dy = (to.y - from.y) / 2;
        const cell = dy === 0 ? "|" : "-";
        resultMatrix.set(new CCoordinate(dx, dy).sum(from), cell);
    });
    return resultMatrix;
};

export const aRegularMap = entryForFile(
    async ({ lines, outputCallback }) => {

        const field = new UnknownSizeField<"#">();
        field.set({ x: 0, y: 0 }, "#");
        const parsed = parse(lines[0]);
        let newCellCount = 0;
        let alreadyVisited = 0;
        let nullTokens = 0;
        const doors: Door[] = [];
        await bfsVisit(parsed, 0, async (token, state) => {
            if (token === null) {
                nullTokens++;
                if (nullTokens > 0 && nullTokens % 1000 === 0) {
                    await outputCallback(`Closing group ${nullTokens / 1000}k`);
                }
                return state;
            }
            const direction = directionMapper(token);
            const newPosition = direction.sum(state);
            doors.push({ from: state, to: newPosition });
            if (field.get(newPosition) === null) {
                newCellCount++;
                field.set(newPosition, "#");
                if (newCellCount > 0 && newCellCount % 100 === 0) {
                    const matrix = field.toMatrix();
                    await outputCallback(matrix.toString((e) => e || "."));
                    await outputCallback(matrix.size);
                }
            } else {
                alreadyVisited++;
                if (alreadyVisited > 0 && alreadyVisited % 1000 === 0) {
                    await outputCallback(`Already visited rising to ${alreadyVisited / 1000}k`);
                }
            }
            return newPosition;
        }, { x: 0, y: 0 }
            , (a, b) => manhattanDistance(a, b) === 0
        );

        const resultRoom = buildRoom(field, doors);

        await outputCallback(resultRoom.toString((e) => e || " "));
        const distances = calculateDistances(
            (coordinate) => field.get(coordinate),
            (start, end) => (start.distance || 0) + manhattanDistance(start.coordinate, end),
            (c) => {
                const from = doors.filter((d) => manhattanDistance(d.from, c) === 0).map((e) => e.to);
                const to = doors.filter((d) => manhattanDistance(d.to, c) === 0).map((e) => e.from);
                const all = [...from, ...to];
                const unique = new Set<string>();
                const result: Coordinate[] = [];
                all.forEach((i) => {
                    const key = JSON.stringify({ x: i.x, y: i.y });
                    if (unique.has(key)) {
                        return;
                    }
                    unique.add(key);
                    result.push(i);
                });
                return result;
            },
            { x: 0, y: 0 }
        );

        const maxDistance = distances.list.map((e) => e.distance).reduce((acc, next) => Math.max(acc || 0, next || 0));
        await outputCallback(maxDistance);
    },
    async ({ lines, outputCallback }) => {
        const field = new UnknownSizeField<"#">();
        field.set({ x: 0, y: 0 }, "#");
        const parsed = parse(lines[0]);
        let newCellCount = 0;
        let alreadyVisited = 0;
        let nullTokens = 0;
        const doors: Door[] = [];
        await bfsVisit(parsed, 0, async (token, state) => {
            if (token === null) {
                nullTokens++;
                if (nullTokens > 0 && nullTokens % 1000 === 0) {
                    await outputCallback(`Closing group ${nullTokens / 1000}k`);
                }
                return state;
            }
            const direction = directionMapper(token);
            const newPosition = direction.sum(state);
            doors.push({ from: state, to: newPosition });
            if (field.get(newPosition) === null) {
                newCellCount++;
                field.set(newPosition, "#");
                if (newCellCount > 0 && newCellCount % 100 === 0) {
                    const matrix = field.toMatrix();
                    await outputCallback(matrix.toString((e) => e || "."));
                    await outputCallback(matrix.size);
                }
            } else {
                alreadyVisited++;
                if (alreadyVisited > 0 && alreadyVisited % 1000 === 0) {
                    await outputCallback(`Already visited rising to ${alreadyVisited / 1000}k`);
                }
            }
            return newPosition;
        }, { x: 0, y: 0 }
            , (a, b) => manhattanDistance(a, b) === 0
        );

        const resultRoom = buildRoom(field, doors);

        await outputCallback(resultRoom.toString((e) => e || " "));
        const distances = calculateDistances(
            (coordinate) => field.get(coordinate),
            (start, end) => (start.distance || 0) + manhattanDistance(start.coordinate, end),
            (c) => {
                const from = doors.filter((d) => manhattanDistance(d.from, c) === 0).map((e) => e.to);
                const to = doors.filter((d) => manhattanDistance(d.to, c) === 0).map((e) => e.from);
                const all = [...from, ...to];
                const unique = new Set<string>();
                const result: Coordinate[] = [];
                all.forEach((i) => {
                    const key = JSON.stringify({ x: i.x, y: i.y });
                    if (unique.has(key)) {
                        return;
                    }
                    unique.add(key);
                    result.push(i);
                });
                return result;
            },
            { x: 0, y: 0 }
        );

        const interestingDistances = distances
            .list
            .map((e) => e.distance)
            .filter((d) => (d !== null && d >= 1000))
            .length;
        await outputCallback(interestingDistances);
    },
    { key: "a-regular-map", title: "A Regular Map", stars: 2, embeddedData: "a-regular-map/index" }
);
