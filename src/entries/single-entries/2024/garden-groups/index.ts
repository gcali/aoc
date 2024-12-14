import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { DefaultDict, Queue, SerializableDictionary, SerializableSet } from "../../../../support/data-structure";
import { CCoordinate, Coordinate, CoordinateSet, directions, getSurrounding, manhattanDistance, multiplyCoordinate, rotate, scalarCoordinates, serialization, sumCoordinate } from "../../../../support/geometry";
import { exampleInput } from "./example";

type Border = {
    c: Coordinate;
    type: Orientation
}

type Orientation = "horizontal" | "vertical";

const isOrientation = (s: string): s is Orientation => {
    return s === "horizontal" || s === "vertical";
}

const serializeBorder = (b: Border) => `${b.type}_coordinate_${serialization.serialize(b.c)}`;

const moveBorder = (b: Border, direction: CCoordinate): Border => ({...b, c: direction.sum(b.c)});

const deserializeBorder = (s: string): Border => {
    const [typeToken, cToken] = s.split("_coordinate_");
    if (!isOrientation(typeToken)) {
        throw new Error("Error during deserialization");
    }
    return {
        c: serialization.deserialize(cToken),
        type: typeToken
    };
}

export const gardenGroups = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const garden = new Parser(lines)
            .matrix(e => e);
        
        let nextAreaIndex = 0;
        const areaLookup = new SerializableDictionary<Coordinate, number>(serialization);
        const areaStarts = new Map<number, Coordinate>();
        const singlePerimeters = new SerializableDictionary<Coordinate, number>(serialization);
        const areaPerimeters = new DefaultDict<number, number>(() => 0);
        const areas = new DefaultDict<number, Coordinate[]>(() => []);
        const border = new DefaultDict<number, Coordinate[]>(() => []);
        garden.onEveryCellSync((c, e) => {
            if (areaLookup.has(c)) {
                return;
            }
            const currentAreaIndex = nextAreaIndex++;
            areaStarts.set(currentAreaIndex, c);
            areaLookup.set(c, currentAreaIndex);
            const queue = new Queue<Coordinate>();
            queue.add(c);
            const currentArea = areas.ensureAndGet(currentAreaIndex);
            const key = e;
            while (!queue.isEmpty) {
                const current = queue.get()!;
                currentArea.push(current);
                let perimeter = 0;
                for (const s of getSurrounding(current)) {
                    const sKey = garden.get(s);
                    if (sKey === key) {
                        if (!areaLookup.has(s)) {
                            areaLookup.set(s, currentAreaIndex);
                            queue.add(s);
                        }
                    } else {
                        perimeter += 1;
                    }
                }
                singlePerimeters.set(current, perimeter);
                areaPerimeters.update(currentAreaIndex, v => v + perimeter)
                if (perimeter > 0) {
                    border.ensureAndGet(currentAreaIndex).push(current);
                }
            }
        });
        let totalPrice = 0;
        for (const area of areas) {
            const perimeter = areaPerimeters.get(area.key);
            totalPrice += area.value.length * perimeter;
        }
        await resultOutputCallback(totalPrice);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const garden = new Parser(lines)
            .matrix(e => e);
        
        let nextAreaIndex = 0;
        const areaLookup = new SerializableDictionary<Coordinate, number>(serialization);
        const areaStarts = new Map<number, Coordinate>();
        const singlePerimeters = new SerializableDictionary<Coordinate, number>(serialization);
        const areaPerimeters = new DefaultDict<number, number>(() => 0);
        const areas = new DefaultDict<number, Coordinate[]>(() => []);
        const areaBorder = new DefaultDict<number, {c: Coordinate, type: "horizontal" | "vertical"}[]>(() => []);
        garden.onEveryCellSync((c, e) => {
            if (areaLookup.has(c)) {
                return;
            }
            const currentAreaIndex = nextAreaIndex++;
            areaStarts.set(currentAreaIndex, c);
            areaLookup.set(c, currentAreaIndex);
            const queue = new Queue<Coordinate>();
            queue.add(c);
            const currentArea = areas.ensureAndGet(currentAreaIndex);
            const currentBorder = areaBorder.ensureAndGet(currentAreaIndex);
            const key = e;
            while (!queue.isEmpty) {
                const current = queue.get()!;
                currentArea.push(current);
                let perimeter = 0;
                for (const d of [directions.up, directions.down, directions.left, directions.right]) {
                    const s = d.sum(current);
                    const sKey = garden.get(s);
                    if (sKey === key) {
                        if (!areaLookup.has(s)) {
                            areaLookup.set(s, currentAreaIndex);
                            queue.add(s);
                        }
                    } else {
                        perimeter += 1;
                        if (manhattanDistance(directions.up, d) === 0) {
                            currentBorder.push({c: current, type: "horizontal"});
                        } else if (manhattanDistance(directions.down, d) === 0) {
                            currentBorder.push({c: d.sum(current), type: "horizontal"});
                        } else if (manhattanDistance(directions.right, d) === 0) {
                            currentBorder.push({c: current, type: "vertical"});
                        } else if (manhattanDistance(directions.left, d) === 0) {
                            currentBorder.push({c: d.sum(current), type: "vertical"});
                        }
                    }
                }
                singlePerimeters.set(current, perimeter);
                areaPerimeters.update(currentAreaIndex, v => v + perimeter)
            }
        });
        let totalPrice = 0;
        const corners = new SerializableSet<Coordinate>(serialization);
        for (const area of areas) {
            const currentAreaBorders = areaBorder.get(area.key);
            const borderSerialization = {serialize: serializeBorder, deserialize: deserializeBorder};
            const allBorders = new SerializableSet<Border>(borderSerialization);
            currentAreaBorders.forEach(b => allBorders.add(b));
            let sides = 0;
            const howManyCorners = (cell: Coordinate): number => {
                const debugCell = {x: 1, y: 5};
                const topBorder = {c: cell, type: "horizontal" as const};
                const rightBorder = {c: cell, type: "vertical" as const};
                const downBorder = {c: directions.down.sum(cell), type: "horizontal" as const};
                const leftBorder = {c: directions.left.sum(cell), type: "vertical" as const};
                const allCorners = [{
                    convex: [ topBorder, leftBorder ],
                    concave: [moveBorder(topBorder, directions.left), moveBorder(leftBorder, directions.up)]
                }, {
                    convex: [ topBorder, rightBorder ], 
                    concave: [ moveBorder(topBorder, directions.right), moveBorder(rightBorder, directions.up)]
                }, {
                    convex: [ downBorder, leftBorder ], 
                    concave: [ moveBorder(downBorder, directions.left), moveBorder(leftBorder, directions.down)]
                }, {
                    convex: [ downBorder, rightBorder ], 
                    concave: [ moveBorder(downBorder, directions.right), moveBorder(rightBorder, directions.down)]
                }];

                let howMany = 0;
                for (const cornerPair of allCorners) {
                    const hasConvex = cornerPair.convex.every(c => allBorders.has(c));
                    const hasConcave = cornerPair.concave.every(c => allBorders.has(c));
                    if (hasConvex || hasConcave) {
                        if (manhattanDistance(cell, debugCell) === 0) {
                        }
                        howMany++;
                    }
                }
                if (howMany > 0) {
                    corners.add(cell);
                }
                return howMany;

            }
            for (const cell of area.value) {
                sides += howManyCorners(cell);
            }
            totalPrice += area.value.length * sides;
        }
        await resultOutputCallback(totalPrice);
    },
    {
        key: "garden-groups",
        title: "Garden Groups",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 12,
        exampleInput,
        stars: 2
    }
);