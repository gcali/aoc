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
    blizzards: BlizzardLookup;
    minute: number;
    states: string[];
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
            occupied.push(occupation);
        }

        await outputCallback("Done: " + occupied.length);

        const queue = new Queue<State>();
        queue.add({
            blizzards,
            position: start,
            minute: 0,
            states: [/*show(blizzards, start, bounds)*/]
        });

        let highestMinute = 0;

        const encountered = new Set<string>();

        while (!queue.isEmpty) {
            const {blizzards, position, minute, states} = queue.get()!;
            if (minute > highestMinute) {
                highestMinute = minute;
                await outputCallback(highestMinute);
            }
            if (manhattanDistance(position, end) === 0) {
                //finished
                // await outputCallback(states.join("\n----\n"));
                await resultOutputCallback(minute);
                return;
            }
            const newBlizzards = new DefaultDict<Coordinate, CCoordinate[]>(() => [], serialization);
            for (const blizzard of blizzards) {
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
                }
            }
            const candidatePositions = getSurrounding(position).concat([position])
                .filter(e => isInBounds(e, bounds) || [start,end].some(x => manhattanDistance(e,x) === 0))
                .filter(e => !newBlizzards.has(e));
            for (const candidate of candidatePositions) {
                const serialized = show(newBlizzards, candidate, bounds);
                if (!encountered.has(serialized)) {
                    queue.add({
                        blizzards: newBlizzards,
                        minute: minute+1,
                        position: candidate,
                        // states: [...states, show(newBlizzards, candidate, bounds)]
                        states: []
                    });
                    encountered.add(serialized);
                }
            }
        }

        throw new Error("Could not get to the exit");

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = lines.map(l => parseInt(l, 10));
        let result: any = 0
        for (const x of lines) { 
        }
        for (const x of ns) { 
        }
        await resultOutputCallback(result);
    },
    {
        key: "blizzard-basin",
        title: "Blizzard Basin",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 24,
        exampleInput
    }
);