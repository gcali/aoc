import { NotImplementedError } from "../../../../support/error";
import { Coordinate3d, CoordinateSet, manhattanDistance, sumCoordinate } from "../../../../support/geometry";
import { permutationGenerator, subsetGenerator } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

const xRotate = (c: Coordinate3d): Coordinate3d => ({
    x: c.x,
    z: -c.y,
    y: c.z
});

const yRotate = (c: Coordinate3d): Coordinate3d => ({
    x: c.z,
    y: c.y,
    z: -c.x
});

const zRotate = (c: Coordinate3d): Coordinate3d => ({
    x: c.y,
    y: -c.x,
    z: c.z
});

type Mapping = (points: Coordinate3d) => Coordinate3d;

const combine = (...mappings: Mapping[]): Mapping => {
    return (x) => {
        let c = x;
        for (const m of mappings) {
            c = m(c);
        }
        return c;
    };
};

function *allMappings(): Iterable<Mapping> {
    for (const order of permutationGenerator([0, 1, 2])) {
        for (const subset of subsetGenerator([0, 1, 2], 0)) {
            yield (c: Coordinate3d) => {
                    const raw = [c.x, c.y, c.z];
                    const ordered = order.map((k) => raw[k]);
                    const inverted = ordered.map((k, i) => subset.includes(i) ? -k : k);
                    return {
                        x: inverted[0],
                        y: inverted[1],
                        z: inverted[2]
                    } as Coordinate3d;
            };
        }
        // first = false;
    }
}

function *brutePermutations(points: Coordinate3d[]): Iterable<{points: Coordinate3d[], mapping: Mapping}> {
    for (const mapping of allMappings()) {
        yield {
            points: points.map(mapping),
            mapping
        };
    }
}

function* allPermutations(points: Coordinate3d[]): Iterable<{ points: Coordinate3d[], mapping: Mapping }> {
    const actions: Mapping[] = [
    ];

    for (let i = 0; i < 4; i++) {
        actions.push(xRotate);
        actions.push(xRotate);
        actions.push(xRotate);
        actions.push(combine(xRotate, yRotate));
    }

    actions.push(zRotate);
    actions.push(xRotate);
    actions.push(xRotate);
    actions.push(xRotate);
    actions.push(xRotate, zRotate, zRotate);
    actions.push(xRotate);
    actions.push(xRotate);
    actions.push(xRotate);

    let currentAction: Mapping = (p) => p;

    for (const action of actions) {
        points = points.map(action);
        currentAction = combine(currentAction, action);
        yield { points, mapping: currentAction };
    }
}


const parseLines = (lines: string[]): Coordinate3d[][] => {
    const result: Coordinate3d[][] = [];
    let current: Coordinate3d[] = [];
    for (let line of lines) {
        line = line.trim();
        if (line.length === 0) {
            result.push(current);
            current = [];
        } else if (line.includes(",")) {
            const [x, y, z] = line.split(",").map((e) => parseInt(e, 10));
            current.push({ x, y, z });
        }
    }
    if (current.length > 0) {
        result.push(current);
    }
    return result;
};

const serializePoint = (p: Coordinate3d) => {
    return `${p.x},${p.y},${p.z}`;
};

const deserializePoint = (s: string): Coordinate3d => {
    const [x, y, z] = s.split(",").map((e) => parseInt(e, 10));
    return { x, y, z };
};

const serialize: (p: Coordinate3d[] | Coordinate3d) => string = (p) => {
    if ((p as Coordinate3d).x !== undefined) {
        return serializePoint(p as Coordinate3d);
    } else {
        const ps = (p as Coordinate3d[]).map(serializePoint);
        return ps.join("|");
    }
};

export const beaconScanner = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseLines(lines);
        const absolutePoints = new Set<string>(input[0].map((p) => serialize(p)));
        const toMatch = input.slice(1);
        while (toMatch.length > 0) {
            let found = false;
            await outputCallback("Still to match: " + toMatch.length);
            for (const candidate of toMatch) {
                for (const perm of brutePermutations(candidate)) {
                    const candidatePoints = perm.points;
                    for (const candidateBeacon of candidatePoints) {
                        for (const rawBeacon of absolutePoints) {
                            const existingBeacon = deserializePoint(rawBeacon);
                            const delta = {
                                x: -candidateBeacon.x + existingBeacon.x,
                                y: -candidateBeacon.y + existingBeacon.y,
                                z: -candidateBeacon.z + existingBeacon.z
                            };
                            const translated = candidatePoints.map((p) => sumCoordinate(p, delta));
                            const serialized = translated.map((p) => serializePoint(p));
                            const overlap = serialized.filter((p) => absolutePoints.has(p)).length;
                            if (overlap >= 12) {
                                serialized.forEach((t) => absolutePoints.add(t));
                                found = true;
                            }
                            if (found) {
                                break;
                            }
                        }
                        if (found) {
                            break;
                        }
                    }
                    if (found) {
                        break;
                    }
                }
                if (found) {
                    const index = toMatch.indexOf(candidate);
                    toMatch.splice(index, 1);
                    break;
                }
            }
            if (!found) {
                throw new Error("Not found an overlap");
            }
        }

        await resultOutputCallback(absolutePoints.size);

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseLines(lines);
        const absolutePoints = new Set<string>(input[0].map((p) => serialize(p)));
        const toMatch = input.slice(1);
        const scannerPositions: Coordinate3d[] = [{x: 0, y: 0, z: 0}];
        while (toMatch.length > 0) {
            let found = false;
            await outputCallback("Still to match: " + toMatch.length);
            for (const candidate of toMatch) {
                for (const perm of brutePermutations(candidate)) {
                    const candidatePoints = perm.points;
                    for (const candidateBeacon of candidatePoints) {
                        for (const rawBeacon of absolutePoints) {
                            const existingBeacon = deserializePoint(rawBeacon);
                            const delta = {
                                x: -candidateBeacon.x + existingBeacon.x,
                                y: -candidateBeacon.y + existingBeacon.y,
                                z: -candidateBeacon.z + existingBeacon.z
                            };
                            const translated = candidatePoints.map((p) => sumCoordinate(p, delta));
                            const serialized = translated.map((p) => serializePoint(p));
                            const overlap = serialized.filter((p) => absolutePoints.has(p)).length;
                            if (overlap >= 12) {
                                serialized.forEach((t) => absolutePoints.add(t));
                                found = true;
                            }
                            if (found) {
                                scannerPositions.push(delta);
                                break;
                            }
                        }
                        if (found) {
                            break;
                        }
                    }
                    if (found) {
                        break;
                    }
                }
                if (found) {
                    const index = toMatch.indexOf(candidate);
                    toMatch.splice(index, 1);
                    break;
                }
            }
            if (!found) {
                throw new Error("Not found an overlap");
            }
        }

        let bestDistance = Number.NEGATIVE_INFINITY;

        await outputCallback(scannerPositions);

        for (const a of scannerPositions) {
            for (const b of scannerPositions) {
                if (manhattanDistance(a, b) > 0) {
                    bestDistance = Math.max(bestDistance, manhattanDistance(a, b));
                }
            }
        }

        await resultOutputCallback(bestDistance);
    },
    {
        key: "beacon-scanner",
        title: "Beacon Scanner",
        supportsQuickRunning: true,
        embeddedData: true
    }
);
