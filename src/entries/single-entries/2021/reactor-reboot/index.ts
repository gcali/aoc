import { entryForFile } from "../../../entry";

type Range = {
    from: number;
    to: number;
};

type Cube = {
    x: Range;
    y: Range;
    z: Range;
};

type Instruction = {
    action: "on" | "off";
} & Cube;

function *segments(a: Range, b: Range): Iterable<Range> {
    if ((b.to < a.from || a.to < b.from) ||
    (b.from <= a.from && b.to >= a.to)) {
        // all inside or all outside
        yield a;
        return;
    }
    if (b.from <= a.from) {
        yield {from: a.from, to: b.to};
        yield {from: b.to + 1, to: a.to};
    } else if (b.to >= a.to) {
        yield {from: a.from, to: b.from - 1};
        yield {from: b.from, to: a.to};
    } else {
        // clipper is entirely inside
        yield {from: a.from, to: b.from - 1};
        yield {from: b.from, to: b.to};
        yield {from: b.to + 1, to: a.to};
    }
}

const splitCube = (target: Cube, clipper: Cube): Cube[] => {
    const candidateCubes: Cube[] = [];
    for (const x of segments(target.x, clipper.x)) {
        for (const y of segments(target.y, clipper.y)) {
            for (const z of segments(target.z, clipper.z)) {
                candidateCubes.push({ x, y, z });
            }
        }
    }
    return candidateCubes;
};


const isInside = (inner: Cube, outer: Cube): boolean => {
    for (const key of ["x", "y", "z"] as Array<keyof Cube>) {
        if (inner[key].from < outer[key].from || inner[key].to > outer[key].to) {
            return false;
        }
    }
    return true;
};
const filterOut = (cubes: Cube[], clipper: Cube): Cube[] => cubes.filter((c) => !isInside(c, clipper));

const splitFilter = (target: Cube, clipper: Cube): Cube[] => joinCubes(filterOut(splitCube(target, clipper), clipper));

const cubeKeys = ["x", "y", "z"] as Array<keyof Cube>;

const tryJoin = (a: Cube, b: Cube): Cube | null => {
    const matching = cubeKeys.filter((k) => a[k].from === b[k].from && a[k].to === b[k].to);
    if (matching.length === 3) {
        return a;
    }
    if (matching.length !== 2) {
        return null;
    }
    const [mismatched] = cubeKeys.filter((k) => !matching.includes(k));
    let first = b;
    let second = a;
    if (a[mismatched].from < b[mismatched].from) {
        first = a;
        second = b;
    }
    if (first[mismatched].to === second[mismatched].from - 1) {
        const cube = {
            x: {from: 0, to: 0},
            y: {from: 0, to: 0},
            z: {from: 0, to: 0},
        };
        for (const k of matching) {
            cube[k] = {...a[k]};
        }
        cube[mismatched] = {
            from: first[mismatched].from,
            to: second[mismatched].to
        };
        return cube;
    }
    return null;
};

const joinCubes = (cubes: Cube[]): Cube[] => {
    if (cubes.length === 0) {
        return [];
    }
    let toJoin = [...cubes];
    const joined: Cube[] = [];

    while (toJoin.length > 0) {
        let current = toJoin.pop()!;
        const matched: Cube[] = [];
        for (const other of toJoin) {
            const joinResult = tryJoin(current, other);
            if (joinResult !== null) {
                matched.push(other);
                current = joinResult;
            }
        }
        toJoin = toJoin.filter((e) => !matched.includes(e));
        joined.push(current);
    }
    return joined;
};

const parseInput = (lines: string[]): Instruction[] => {
    const parseRange = (s: string): Range => {
        const [from, to] = s.slice(2).split("..").map((e) => parseInt(e, 10)).sort((a, b) => a - b);
        return { from, to };
    };
    return lines.map((line) => {
        const [action, rest] = line.split(" ");
        if (action !== "on" && action !== "off") {
            throw new Error("Invalid action " + action);
        }
        const [x, y, z] = rest.split(",").map(parseRange);
        return { action, x, y, z };
    });
};

const area = (c: Cube): number => {
    const sides = (["x", "y", "z"] as Array<keyof Cube>).map((axis) => c[axis].to - c[axis].from + 1);
    return sides.reduce((acc, next) => acc * next, 1);
};

export const reactorReboot = entryForFile(
    async ({ lines, resultOutputCallback }) => {
        const instructions = parseInput(lines);
        const baseRange = { from: -50, to: 50 };
        let cubes: Cube[] = [];
        for (const i of instructions) {
            const isOut = cubeKeys.some((key) => i[key].to < baseRange.from || i[key].from > baseRange.to);
            if (isOut) {
                continue;
            }
            cubes = cubes.flatMap((c) => splitFilter(c, i));
            if (i.action === "on") {
                cubes.push(i);
            }

        }

        const sizes = cubes.map(area);
        await resultOutputCallback(sizes.reduce((acc, next) => acc + next, 0));
    },
    async ({ lines, resultOutputCallback }) => {
        const instructions = parseInput(lines);
        let cubes: Cube[] = [];
        let max = 0;
        for (const i of instructions) {
            cubes = cubes.flatMap((c) => splitFilter(c, i));
            if (i.action === "on") {
                cubes.push(i);
            }

            max = Math.max(cubes.length, max);

        }
        const sizes = cubes.map(area);
        console.log(max);
        await resultOutputCallback(sizes.reduce((acc, next) => acc + next, 0));
    },
    {
        key: "reactor-reboot",
        title: "Reactor Reboot",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);
