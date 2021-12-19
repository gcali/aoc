import { NotImplementedError } from "../../../../support/error";
import { Coordinate3d, sumCoordinate } from "../../../../support/geometry";
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
            for (const candidate of toMatch) {
                for (const perm of allPermutations(candidate)) {
                    const candidatePoints = perm.points;
                    for (const candidateBeacon of candidatePoints) {
                        for (const rawBeacon of absolutePoints) {
                            const existingBeacon = deserializePoint(rawBeacon);
                            const delta = {
                                x: candidateBeacon.x - existingBeacon.x,
                                y: candidateBeacon.y - existingBeacon.y,
                                z: candidateBeacon.z - existingBeacon.z
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
        throw new NotImplementedError();
    },
    {
        key: "beacon-scanner",
        title: "Beacon Scanner",
        supportsQuickRunning: true,
        embeddedData: true
    }
);
