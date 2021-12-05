import { SimpleBest, ascending } from "./best";
import { coordinateToKey } from "../entries/single-entries/2019/oxygen-system";

export interface Coordinate {
    x: number;
    y: number;
}

export interface Coordinate3d extends Coordinate {
    z: number;
}

export interface Coordinate4d extends Coordinate3d {
    w: number;
}

export type FullCoordinate = Coordinate | Coordinate3d | Coordinate4d;

function is4d(c: FullCoordinate): c is Coordinate4d {
    return (c as Coordinate4d).w !== undefined;
}
function is3d(c: FullCoordinate): c is Coordinate3d {
    return (c as Coordinate3d).z !== undefined && (c as Coordinate4d).w === undefined;
}

function is2d(c: FullCoordinate): c is Coordinate {
    return (c as Coordinate3d).z === undefined;
}

function isBounds(c: Coordinate | Bounds): c is Bounds {
    return (c as Bounds).size !== undefined;
}

export class CCoordinate implements Coordinate {

    public get opposite() {
        return new CCoordinate(-this.x, -this.y);
    }

    public static fromCoordinate(c: Coordinate) {
        return new CCoordinate(c.x, c.y);
    }
    public constructor(public x: number, public y: number) {

    }

    public isInBounds = (b: Bounds | Coordinate): boolean => {
        if (isBounds(b)) {
            return isInBounds(this, b);
        } else {
            return isInBounds(this, {
                size: b,
                topLeft: {
                    x: 0,
                    y: 0
                }
            });
        }
    }

    public is = (other: Coordinate) => {
        return manhattanDistance(this, other) === 0;
    }

    public sum = (other: Coordinate) => {
        const result = sumCoordinate(this, other);
        return new CCoordinate(result.x, result.y);
    }

    public diff = (other: Coordinate) => {
        const result = sumCoordinate(this, { x: -other.x, y: -other.y });
        return new CCoordinate(result.x, result.y);
    }

    public toString(): string {
        return `(${this.x},${this.y})`;
    }

    public times = (t: number): CCoordinate => {
        const result = scalarCoordinates(this, t);
        return new CCoordinate(result.x, result.y);
    }
}

export const directions = {
    up: new CCoordinate(0, -1),
    down: new CCoordinate(0, 1),
    left: new CCoordinate(-1, 0),
    right: new CCoordinate(1, 0),
    upLeft: new CCoordinate(-1, -1),
    upRight: new CCoordinate(1, -1),
    downLeft: new CCoordinate(-1, 1),
    downRight: new CCoordinate(1, 1)
};

export const directionList = [
    directions.up,
    directions.down,
    directions.left,
    directions.right,
    directions.upLeft,
    directions.upRight,
    directions.downLeft,
    directions.downRight
];

export type Rotation = "Clockwise" | "Counterclockwise" | "None";
export function rotate(
    coordinate: CCoordinate,
    direction: Rotation,
    times: number = 1
): CCoordinate {
    if (times > 1) {
        coordinate = rotate(coordinate, direction, times - 1);
    }
    switch (direction) {
        case "Counterclockwise":
            return new CCoordinate(coordinate.y, -coordinate.x);
        case "Clockwise":
            return new CCoordinate(-coordinate.y, coordinate.x);
        case "None":
            return coordinate;
    }
}


function fillWithZero(c: Coordinate): Coordinate;
function fillWithZero(c: Coordinate3d): Coordinate3d;
function fillWithZero(c: Coordinate4d): Coordinate4d;
function fillWithZero(c: FullCoordinate): FullCoordinate {
    if (is4d(c)) {
        if (!c.w) {
            c.w = 0;
        }
        if (!c.z) {
            c.z = 0;
        }
    }
    if (is3d(c)) {
        if (!c.z) {
            c.z = 0;
        }
    }
    if (!c.x) {
        c.x = 0;
    }
    if (!c.y) {
        c.y = 0;
    }
    return c;
}

export interface Bounds {
    topLeft: Coordinate;
    size: Coordinate;
}

export function ascendingCompare(a: Coordinate, b: Coordinate): number {
    if (b.y === a.y) {
        return ascending(a.x, b.x);
    } else {
        return ascending(a.y, b.y);
    }
}

export function isInBounds(c: Coordinate, bounds: Bounds) {
    return (
        c.x >= bounds.topLeft.x &&
        c.y >= bounds.topLeft.y &&
        c.x < bounds.topLeft.x + bounds.size.x &&
        c.y < bounds.topLeft.y + bounds.size.y
    );
}
export const getBoundaries = (points: Coordinate[]): Bounds => {
    if (points.length === 0) {
        return {
            topLeft: { x: 0, y: 0 },
            size: { x: 0, y: 0 }
        };
    }
    const { maxX, minX, maxY, minY } = getRanges(points);
    const size = {
        x: (maxX.currentBest! - minX.currentBest! + 1),
        y: (maxY.currentBest! - minY.currentBest! + 1),
    };
    return {
        topLeft: {
            x: minX.currentBest!,
            y: minY.currentBest!,
        },
        size,
    };
};


export function sumCoordinate(a: Coordinate4d, b: Coordinate4d): Coordinate4d;
export function sumCoordinate(a: Coordinate3d, b: Coordinate3d): Coordinate3d;
export function sumCoordinate(a: Coordinate, b: Coordinate): Coordinate;
export function sumCoordinate(a: FullCoordinate, b: FullCoordinate): FullCoordinate {
    a = fillWithZero(a);
    b = fillWithZero(b);
    if (is4d(a) && is4d(b)) {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
            z: a.z + b.z,
            w: a.w + b.w,
        };
    } else if (is3d(a) && is3d(b)) {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
            z: a.z + b.z
        };
    } else {
        return {
            x: a.x + b.x,
            y: a.y + b.y,
        };
    }
}

export function getDirection(from: Coordinate, to: Coordinate): CCoordinate {
    if (manhattanDistance(from, to) !== 1) {
        throw new RangeError("Cannot move to distant cell");
    }
    if (from.x > to.x) {
        return directions.left;
    } else if (from.x < to.x) {
        return directions.right;
    } else if (from.y > to.y) {
        return directions.up;
    } else if (from.y < to.y) {
        return directions.down;
    } else {
        throw new Error("Something went wrong :(");
    }
}

export const scalarCoordinates = (a: Coordinate, l: number) => ({ x: a.x * l, y: a.y * l });

export const oppositeCoordinate = (a: Coordinate): Coordinate => ({ x: -a.x, y: -a.y });

export const diffCoordinate = (a: Coordinate, b: Coordinate): Coordinate => sumCoordinate(a, oppositeCoordinate(b));
export const manhattanDistance = (a: FullCoordinate, b: FullCoordinate) => {
    const w = (is4d(a) && is4d(b)) ? Math.abs(a.w - b.w) : 0;
    const z = ((is3d(a) && is3d(b)) || (is4d(a) && is4d(b))) ? Math.abs(a.z - b.z) : 0;
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + z + w;
};

export const isSameCoordinate = (a: Coordinate, b: Coordinate) => manhattanDistance(a, b) === 0;

export function getSurrounding(c: Coordinate): Coordinate[];
export function getSurrounding(c: Coordinate3d): Coordinate3d[];
export function getSurrounding(c: Coordinate4d): Coordinate4d[];
export function getSurrounding(c: FullCoordinate): FullCoordinate[] {
    if (is2d(c)) {
        return [
            directions.up,
            directions.left,
            directions.down,
            directions.right
        ].map((d) => d.sum(c));
    } else {
        return getFullSurrounding(c).filter((e) => manhattanDistance(c, e) === 1);
    }
}

export function getFullSurrounding(coordinate: Coordinate): Coordinate[];
export function getFullSurrounding(coordinate: Coordinate3d): Coordinate3d[];
export function getFullSurrounding(coordinate: Coordinate4d): Coordinate4d[];
export function getFullSurrounding(coordinate: FullCoordinate): FullCoordinate[] {
    if (is4d(coordinate)) {
        const result: Coordinate4d[] = [];
        const deltas = [-1, 0, 1];
        for (const x of deltas) {
            for (const y of deltas) {
                for (const z of deltas) {
                    for (const w of deltas) {
                        const neighbour = sumCoordinate(coordinate, { x, y, z, w });
                        if (manhattanDistance(neighbour, coordinate) === 0) {
                            continue;
                        }
                        result.push(neighbour);
                    }
                }
            }
        }
        return result;
    } else if (is2d(coordinate)) {
        const c = coordinate;
        return [
            directions.up,
            directions.left,
            directions.down,
            directions.right,
            directions.upLeft,
            directions.upRight,
            directions.downLeft,
            directions.downRight,
        ].map((d) => d.sum(c));
    } else {
        const result: Coordinate3d[] = [];
        const deltas = [-1, 0, 1];
        for (const x of deltas) {
            for (const y of deltas) {
                for (const z of deltas) {
                    const neighbour = sumCoordinate(coordinate, { x, y, z });
                    if (manhattanDistance(neighbour, coordinate) === 0) {
                        continue;
                    }
                    result.push(neighbour);
                }
            }
        }
        return result;
    }
}


export function getRanges(points: Coordinate[]) {
    const minComparator = (a: number, b: number) => b - a;
    const maxComparator = (a: number, b: number) => a - b;
    const minX = new SimpleBest<number>(minComparator);
    const maxX = new SimpleBest<number>(maxComparator);
    const minY = new SimpleBest<number>(minComparator);
    const maxY = new SimpleBest<number>(maxComparator);
    points.forEach((p) => {
        minX.add(p.x);
        maxX.add(p.x);
        minY.add(p.y);
        maxY.add(p.y);
    });
    return { maxX, minX, maxY, minY };
}

export function getCoordinateForGrid(index: number, rows: number): Coordinate {
    return {
        x: Math.floor(index / rows),
        y: index % rows
    };
}


export const serialization = {
    serialize(c: FullCoordinate): string {
        const els = [c.x, c.y];
        if (is3d(c)) {
            els.push(c.z);
        } else if (is4d(c)) {
            els.push(c.z);
            els.push(c.w);
        }
        return els.join("|");
    },
    deserialize4d(s: string): Coordinate4d {
        const split = s.split("|").map((e) => parseInt(e, 10));
        if (split.length !== 4) {
            throw new RangeError("Could not deserialize " + s);
        }
        return {
            x: split[0],
            y: split[1],
            z: split[2],
            w: split[3],
        };
    },
    deserialize3d(s: string): Coordinate3d {
        const split = s.split("|").map((e) => parseInt(e, 10));
        if (split.length !== 3) {
            throw new RangeError("Could not deserialize " + s);
        }
        return {
            x: split[0],
            y: split[1],
            z: split[2]
        };
    },
    deserialize(s: string): Coordinate {
        const split = s.split("|");
        if (split.length !== 2) {
            throw new RangeError("Could not deserialize " + s);
        }
        return {
            x: parseInt(split[0], 10),
            y: parseInt(split[1], 10)
        };
    }
};

export const euclidean3dDistance = (a: Coordinate3d, b: Coordinate3d): number => {
    return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2);
};

export const multiplyCoordinate = (a: Coordinate, b: Coordinate): Coordinate => {
    return {
        x: a.x * b.x,
        y: a.y * b.y
    };
};
export const floatRotateRadians = (center: Coordinate, point: Coordinate, angle: number): Coordinate => {
    const { x: cx, y: cy } = center;
    const { x, y } = point;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
    const ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return { x: nx, y: ny };
};

export const floatRotate = (center: Coordinate, point: Coordinate, angle: number): Coordinate => {
    const { x: cx, y: cy } = center;
    const { x, y } = point;
    const radians = (Math.PI / 180) * angle;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
    const ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return { x: nx, y: ny };
};
