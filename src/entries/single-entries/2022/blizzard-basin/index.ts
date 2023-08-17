import { lcm } from "../../../../support/algebra";
import { DefaultDict, Queue, SerializableDictionary, SerializableSet } from "../../../../support/data-structure";
import { Bounds, CCoordinate, directions, getSurrounding, isInBounds, isLiteralDirection, manhattanDistance, mapLiteralToDirection, sumCoordinate } from "../../../../support/geometry";
import { Coordinate, serialization } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { entryForFile } from "../../../entry";

const exampleInput = 
`#.######
#>>.<^<#
#.<..<<#
#>v.><>#
#<^v^^>#
######.#`;

const parseInput = (lines: string[]): {
    blizzards: BlizzardLookup;
    bounds: Bounds;
    start: Coordinate;
    end: Coordinate;
} => {
    const size = {
        x: lines[0].length - 2,
        y: lines.length - 2
    };
    const start = {x: 0, y: -1};
    const end = {x: size.x-1,y: size.y};
    // const blizzards = new SerializableSet<Blizzard>({
    //     serialize: (e) => `${serialization.serialize(e.c)}_${serialization.serialize(e.direction)}`,
    //     deserialize: (e) => {
    //         const [c, direction] = e.split("_").map(serialization.deserialize);
    //         return {c, direction};
    //     }
    // });
    const blizzards = new DefaultDict<Coordinate, CCoordinate[]>(() => [], serialization);

    for (let x = 0; x < size.x; x++) {
        for (let y = 0; y < size.y; y++) {
            const cell = lines[y+1][x+1];
            if (isLiteralDirection(cell)) {
                const direction = mapLiteralToDirection(cell);
                blizzards.ensureAndGet({x,y}).push(direction);
            } else if (cell !== ".") {
                throw new Error("Invalid input: " + cell);
            }
        }
    }
    return {
        blizzards,
        end,
        start,
        bounds: {
            size,
            topLeft: {x: 0, y: 0}
        }
    };
}

type BlizzardLookup = DefaultDict<Coordinate, CCoordinate[]>;

type State = {
    position: Coordinate;
    // blizzards: BlizzardLookup;
    minute: number;
    // states: string[];
}

const show = (blizzards: BlizzardLookup, position: Coordinate, bounds: Bounds): string => {
    const matrix = new FixedSizeMatrix<string>(bounds.size);
    for (const {key, value} of blizzards) {
        let v;
        if (value.length > 1) {
            v = "X";
        } else {
            if (value.length === 0) {
                throw new Error("What?");
            }
            const [match] = ([
                [directions.up, "^"],
                [directions.down, "v"], 
                [directions.left, "<"], 
                [directions.right, ">"]
            ] as [CCoordinate, string][]).filter(e => {
                const [c,s] = e;
                return manhattanDistance(c, value[0]) === 0;
            });
            if (match) {
                v = match[1];
            }
        }
        if (matrix.get(key)) {
            matrix.set(key, "K");
        } else {
            matrix.set(key, v);
        }
    }
    if (isInBounds(position, bounds)) {
        matrix.set(position, "E");
    }
    return matrix.toString(e => e || ".");

}

const findMinutes = (
    start: Coordinate, 
    end: Coordinate, 
    startMinute: number,
    period: number,
    bounds: Bounds,
    occupied: SerializableSet<Coordinate>[]
) => {
        const queue = new Queue<State>();
        queue.add({
            position: start,
            minute: startMinute,
        });

        const encountered = new Set<string>();

        while (!queue.isEmpty) {
            const {position, minute} = queue.get()!;
            if (manhattanDistance(position, end) === 0) {
                return minute;
            }
            const candidatePositions = getSurrounding(position).concat([position])
                .filter(e => isInBounds(e, bounds) || [start,end].some(x => manhattanDistance(e,x) === 0))
                .filter(e => !occupied[minute%period].has(e));
            for (const candidate of candidatePositions) {
                const serialized = `${minute%period}_${serialization.serialize(candidate)}`;
                if (!encountered.has(serialized)) {
                    queue.add({
                        minute: minute+1,
                        position: candidate,
                    });
                    encountered.add(serialized);
                }
            }
        }

}

export const blizzardBasin = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const {
            blizzards,
            bounds,
            start,
            end
        } = parseInput(lines);

        const period = lcm(bounds.size.x, bounds.size.y);
        await outputCallback(period);

        let simulatedBlizzards = new DefaultDict<Coordinate, CCoordinate[]>(() => [], serialization);

        for (const blizzard of blizzards) {
            simulatedBlizzards.set(blizzard.key, blizzard.value);
        }

        const occupied: SerializableSet<Coordinate>[] = [];

        for (let i = 0; i < period; i++) {
            const newBlizzards = new DefaultDict<Coordinate, CCoordinate[]>(() => [], serialization);
            const occupation = new SerializableSet<Coordinate>(serialization);
            for (const blizzard of simulatedBlizzards) {
                for (const direction of blizzard.value) {
                    const position = blizzard.key;
                    const newPosition = sumCoordinate(position, direction);
                    if (newPosition.x < 0) {
                        newPosition.x = bounds.size.x-1;
                    } else if (newPosition.x >= bounds.size.x) {
                        newPosition.x = 0;
                    } else if (newPosition.y < 0) {
                        newPosition.y = bounds.size.y-1;
                    } else if (newPosition.y >= bounds.size.y) {
                        newPosition.y = 0;
                    }
                    newBlizzards.ensureAndGet(newPosition).push(direction);
                    occupation.add(newPosition);
                }
            }
            simulatedBlizzards = newBlizzards;
            occupied.push(occupation);
        }

        const startMinute = 0;

        const result = findMinutes(start, end, startMinute, period, bounds, occupied);

        if (!result) {
            throw new Error("Could not get to the exit");
        }

        await resultOutputCallback(result);

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const {
            blizzards,
            bounds,
            start,
            end
        } = parseInput(lines);

        const period = lcm(bounds.size.x, bounds.size.y);
        await outputCallback(period);

        let simulatedBlizzards = new DefaultDict<Coordinate, CCoordinate[]>(() => [], serialization);

        for (const blizzard of blizzards) {
            simulatedBlizzards.set(blizzard.key, blizzard.value);
        }

        const occupied: SerializableSet<Coordinate>[] = [];

        for (let i = 0; i < period; i++) {
            const newBlizzards = new DefaultDict<Coordinate, CCoordinate[]>(() => [], serialization);
            const occupation = new SerializableSet<Coordinate>(serialization);
            for (const blizzard of simulatedBlizzards) {
                for (const direction of blizzard.value) {
                    const position = blizzard.key;
                    const newPosition = sumCoordinate(position, direction);
                    if (newPosition.x < 0) {
                        newPosition.x = bounds.size.x-1;
                    } else if (newPosition.x >= bounds.size.x) {
                        newPosition.x = 0;
                    } else if (newPosition.y < 0) {
                        newPosition.y = bounds.size.y-1;
                    } else if (newPosition.y >= bounds.size.y) {
                        newPosition.y = 0;
                    }
                    newBlizzards.ensureAndGet(newPosition).push(direction);
                    occupation.add(newPosition);
                }
            }
            simulatedBlizzards = newBlizzards;
            occupied.push(occupation);
        }

        const startMinute = 0;

        const toEnd = findMinutes(start, end, startMinute, period, bounds, occupied);

        if (!toEnd) {
            throw new Error("Could not get to the end");
        }

        const backToStart = findMinutes(end, start, toEnd, period, bounds, occupied);

        if (!backToStart) {
            throw new Error("Could not get back to start");
        }

        const result = findMinutes(start, end, backToStart, period, bounds, occupied);

        if (!result) {
            throw new Error("Could not finish");
        }

        await resultOutputCallback(result);

    },
    {
        key: "blizzard-basin",
        title: "Blizzard Basin",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 24,
        exampleInput,
        stars: 2
    }
);