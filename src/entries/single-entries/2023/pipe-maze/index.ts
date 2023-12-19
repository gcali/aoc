import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { Queue } from "../../../../support/data-structure";
import { Coordinate, serialization, getSurrounding, manhattanDistance, directions, FullCoordinate, CCoordinate, scalarCoordinates, getFullSurrounding } from "../../../../support/geometry";
import { SerializableSet, SerializableDictionary } from "../../../../support/data-structure";
import { FixedSizeMatrix } from "../../../../support/matrix";

const isRightConnected = (s: string | undefined) => (s === "S" || s === "F" || s === "-" || s === "L");
const isLeftConnected = (s: string | undefined) => (s === "S" || s === "J" || s === "-" || s === "7");
const isUpConnected = (s: string | undefined) => (s === "S" || s === "J" || s === "|" || s === "L");
const isDownConnected = (s: string | undefined) => (s === "S" || s === "7" || s === "|" || s === "F");

const isConnected = (startC: Coordinate, startV: string, nC: Coordinate, nV: string) => {
    const isNear = manhattanDistance(startC, nC);
    if (isNear !== 1) {
        return false;
    }
    if (startC.x < nC.x) {
        return isRightConnected(startV) && isLeftConnected(nV);
    } else if (startC.x > nC.x) {
        return isLeftConnected(startV) && isRightConnected(nV);
    } else if (startC.y < nC.y) {
        return isDownConnected(startV) && isUpConnected(nV);
    } else if (startC.y > nC.y) {
        return isUpConnected(startV) && isDownConnected(nV);
    } else {
        throw new Error("Invalid");
    }
}

export const pipeMaze = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrix(e => e);
        const start = ns.findOneWithCoordinate(e => e === "S");
        if (!start) {
            throw new Error("Could not find starting point");
        }
        const distances = visitLoop(start, ns);
        const maxDistance = Math.max(...distances.values());
        await resultOutputCallback(maxDistance);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrix(e => e);
        const start = ns.findOneWithCoordinate(e => e === "S");
        if (!start) {
            throw new Error("Could not find starting point");
        }
        const distances = visitLoop(start, ns);
        const visited = new SerializableSet<Coordinate>(serialization, distances.keys());
        clearNonMainPipes(ns, visited);
        replaceStartingPoint(start, ns);
        const enlarged = enlarge(ns);
        const isExternal = new Set<string>();
        const filled = new Set<string>();
        fillEmptyParts(enlarged, filled, isExternal);
        const reduced = reduce(enlarged);
        let count = 0;
        for (let x = 0; x < reduced.size.x; x++) {
            for (let y = 0; y < reduced.size.y; y++){ 
                const value = reduced.get({x,y});
                if (value && filled.has(value) && !isExternal.has(value)) {
                    count++;
                }
            }
        }
        await resultOutputCallback(count);
    },
    {
        key: "pipe-maze",
        title: "Pipe Maze",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 10,
        stars: 2,
        exampleInput: [`7-F7-
.FJ|7
SJLL7
|F--J
LJ.LJ`, `FF7FSF7F7F7F7F7F---7
L|LJ||||||||||||F--J
FL-7LJLJ||||||LJL-77
F--JF--7||LJLJ7F7FJ-
L---JF-JLJ.||-FJLJJ7
|F|F-JF---7F7-L7L|7|
|FFJF7L7F-JF7|JL---7
7-L-JL7||F7|L7F-7F7|
L.L7LFJ|||||FJL7||LJ
L7JLJL-JLJLJL--JLJ.L`]
    }
);

const reduce = (ns: FixedSizeMatrix<string>): FixedSizeMatrix<string> => {
    const result = new FixedSizeMatrix<string>({x: ns.size.x/3, y: ns.size.y/3});
    for (let x = 0; x < result.size.x; x++) {
        for (let y = 0; y < result.size.y; y++) {
            result.set({x,y}, ns.get({x: x * 3 + 1, y: y * 3 + 1}));
        }
    }
    return result;
};

const enlarge = (ns: FixedSizeMatrix<string>): FixedSizeMatrix<string> => {
    const result = new FixedSizeMatrix<string>(scalarCoordinates(ns.size, 3));
    for (let x = 0; x < ns.size.x; x++) {
        for (let y = 0; y < ns.size.y; y++) {
            const center = {x: x * 3 + 1, y: y * 3 + 1};
            const centerV = ns.get({x,y});
            result.set(center, centerV);
            for (const neighbour of getFullSurrounding(center)) {
                if (manhattanDistance(neighbour, center) > 1) {
                    result.set(neighbour, ".");
                } else {
                    let toSet: string = ".";
                    if (neighbour.x < center.x) {
                        if (isLeftConnected(centerV)) {
                            toSet = "-";
                        }
                    } else if (neighbour.x > center.x) {
                        if (isRightConnected(centerV)) {
                            toSet = "-";
                        }
                    } else if (neighbour.y < center.y) {
                        if (isUpConnected(centerV)) {
                            toSet = "|";
                        }
                    } else if (neighbour.y > center.y) {
                        if (isDownConnected(centerV)) {
                            toSet = "|";
                        }
                    }
                    result.set(neighbour, toSet);
                }
            }
        }
    }
    return result;
}

function clearNonMainPipes(ns: FixedSizeMatrix<string>, visited: SerializableSet<Coordinate>) {
    for (let x = 0; x < ns.size.x; x++) {
        for (let y = 0; y < ns.size.y; y++) {
            if (!visited.has({ x, y })) {
                ns.set({ x, y }, ".");
            }
        }
    }
}

function visitLoop(start: Coordinate, ns: FixedSizeMatrix<string>) {
    const visited = new SerializableSet<Coordinate>(serialization);
    const queue = new Queue<Coordinate>();
    queue.add(start);
    const distances = new SerializableDictionary<Coordinate, number>(serialization);
    distances.set(start, 0);
    while (!queue.isEmpty) {
        const current = queue.get()!;
        if (visited.has(current)) {
            continue;
        }
        visited.add(current);
        const currentDistance = distances.get(current);
        if (currentDistance === undefined) {
            throw new Error("Invalid distance");
        }
        for (const neighbourC of getSurrounding(current)) {
            if (visited.has(neighbourC)) {
                continue;
            }
            const neighbour = ns.get(neighbourC);
            if (!neighbour || neighbour === ".") {
                continue;
            }
            if (!isConnected(current, ns.get(current)!, neighbourC, neighbour)) {
                continue;
            }
            distances.set(neighbourC, currentDistance + 1);
            queue.add(neighbourC);
        }
    }
    return distances;
}

function fillEmptyParts(enlarged: FixedSizeMatrix<string>, filled: Set<string>, isExternal: Set<string>) {
    let nextToFill = 0;
    while (true) {
        const toFill = enlarged.findOneWithCoordinate(e => e === ".");
        if (!toFill) {
            break;
        }
        const queue = new Queue<Coordinate>();
        const visited = new SerializableSet<Coordinate>(serialization);
        visited.add(toFill);
        queue.add(toFill);
        nextToFill++;
        while (!queue.isEmpty) {
            const current = queue.get()!;
            enlarged.set(current, nextToFill.toString());
            filled.add(nextToFill.toString());
            for (const neighbour of getSurrounding(current)) {
                const nV = enlarged.get(neighbour);
                if (nV === undefined) {
                    isExternal.add(nextToFill.toString());
                }
                if (nV !== "." || visited.has(neighbour)) {
                    continue;
                }
                queue.add(neighbour);
                visited.add(neighbour);
            }
        }
    }
}

function replaceStartingPoint(start: Coordinate, ns: FixedSizeMatrix<string>) {
    const options = ["-", "7", "L", "J", "F", "|"];
    for (const option of options) {
        const neighbours = getSurrounding(start);
        const connections = neighbours.filter(e => isConnected(start, option, e, ns.get(e) || "."));
        if (connections.length === 2) {
            ns.set(start, option);
            break;
        }
    }
}
