import { Coordinate, serialization } from "./geometry";
import { Queue } from "./data-structure";

type FieldGetter<TValue, TCoordinate> = (c: TCoordinate) => TValue | undefined;
export interface CellWithDistance<TValue, TCoordinate> {
    cell: TValue;
    coordinate: TCoordinate;
    distance: number | null;
    parent: CellWithDistance<TValue, TCoordinate> | null;
}

interface DistanceGetter<TValue, TCoordinate> {
    list: Array<CellWithDistance<TValue, TCoordinate>>;
    map(c: TCoordinate): (number | null);
    pathTo(c: TCoordinate): CellWithDistance<TValue, TCoordinate>[];
}

type DistanceCalculator<TValue, TCoordinate> =
    (start: CellWithDistance<TValue, TCoordinate>, end: TCoordinate) => number | null;

export function calculateDistancesGenericCoordinates<TValue, TCoordinate>(
    fieldGetter: FieldGetter<TValue, TCoordinate>,
    distanceCalculator: DistanceCalculator<TValue, TCoordinate>,
    getSurrounding: (c: TCoordinate) => TCoordinate[],
    start: TCoordinate,
    serializer: (c: TCoordinate) => string,
    stopAt: ((c: CellWithDistance<TValue, TCoordinate>) => boolean) | null = null
): DistanceGetter<TValue, TCoordinate> {
    const distanceMap: { [key: string]: CellWithDistance<TValue, TCoordinate> } = {};

    const visitQueue = new Queue<CellWithDistance<TValue, TCoordinate>>();

    const startCell = fieldGetter(start);
    if (startCell === undefined) {
        throw new RangeError("Cannot find starting cell");
    }
    const startNode: CellWithDistance<TValue, TCoordinate> = {
        cell: startCell,
        coordinate: start,
        distance: 0,
        parent: null
    };

    distanceMap[serializer(startNode.coordinate)] = startNode;
    visitQueue.add(startNode);

    let forceStop = false;
    while (!visitQueue.isEmpty) {
        const node = visitQueue.get()!;
        const surrounding = getSurrounding(node.coordinate);
        for (const s of surrounding) {
            const withDistance = distanceMap[serializer(s)];
            if (!withDistance) {
                const cell = fieldGetter(s);
                if (cell !== undefined) {
                    const distance = distanceCalculator(node, s);
                    if (distance) {
                        const sWithDistance: CellWithDistance<TValue, TCoordinate> = {
                            cell,
                            coordinate: s,
                            distance,
                            parent: node
                        };
                        distanceMap[serializer(s)] = sWithDistance;
                        if (stopAt && stopAt(sWithDistance))  {
                            forceStop = true;
                            break;
                        }
                        visitQueue.add(sWithDistance);
                    }
                }
            }
        }
        if (forceStop) {
            break;
        }
    }

    return {
        map: (c: TCoordinate) => {
            const v = distanceMap[serializer(c)];
            if (v) {
                return v.distance;
            } else {
                return null;
            }
        },
        pathTo: (c: TCoordinate): CellWithDistance<TValue, TCoordinate>[] => {
            const queue = [];
            let node: CellWithDistance<TValue, TCoordinate> | null = distanceMap[serializer(c)];
            while (node) {
                queue.push(node);
                node = node.parent;
            }
            return queue.reverse();
        },
        list: Object.values(distanceMap)
    };
}

export function calculateDistances<T>(
    fieldGetter: FieldGetter<T, Coordinate>,
    distanceCalculator: DistanceCalculator<T, Coordinate>,
    getSurrounding: (c: Coordinate) => Coordinate[],
    start: Coordinate,
    stopAt: ((c: CellWithDistance<T, Coordinate>) => boolean) | null = null
): DistanceGetter<T, Coordinate> {
    return calculateDistancesGenericCoordinates(
        fieldGetter,
        distanceCalculator,
        getSurrounding,
        start,
        serialization.serialize,
        stopAt
    );
    // const distanceMap: { [key: string]: CellWithDistance<T, Coordinate> } = {};

    // const visitQueue = new Queue<CellWithDistance<T, Coordinate>>();

    // const startCell = fieldGetter(start);
    // if (!startCell) {
    //     throw new RangeError("Cannot find starting cell");
    // }
    // const startNode: CellWithDistance<T, Coordinate> = {
    //     cell: startCell,
    //     coordinate: start,
    //     distance: 0
    // };

    // distanceMap[serialization.serialize(startNode.coordinate)] = startNode;
    // visitQueue.add(startNode);

    // while (!visitQueue.isEmpty) {
    //     const node = visitQueue.get()!;
    //     const surrounding = getSurrounding(node.coordinate);
    //     surrounding.forEach((s) => {
    //         const withDistance = distanceMap[serialization.serialize(s)];
    //         if (!withDistance) {
    //             const cell = fieldGetter(s);
    //             if (cell) {
    //                 const distance = distanceCalculator(node, s);
    //                 if (distance) {
    //                     const sWithDistance: CellWithDistance<T, Coordinate> = {
    //                         cell,
    //                         coordinate: s,
    //                         distance
    //                     };
    //                     distanceMap[serialization.serialize(s)] = sWithDistance;
    //                     visitQueue.add(sWithDistance);
    //                 }
    //             }
    //         }
    //     });
    // }

    // return {
    //     map: (c: Coordinate) => {
    //         const v = distanceMap[serialization.serialize(c)];
    //         if (v) {
    //             return v.distance;
    //         } else {
    //             return null;
    //         }
    //     },
    //     list: Object.values(distanceMap)
    // };
}
