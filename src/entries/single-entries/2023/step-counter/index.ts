import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { SerializableDictionary } from "../../../../support/data-structure";
import { Coordinate, diffCoordinate, getSurrounding, serialization, sumCoordinate } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { UnknownSizeField } from "../../../../support/field";

type Cell = "." | "#" | "S";

export const stepCounter = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrix(e => e as Cell);
        console.log(ns.size);
        const visitedEven = new SerializableDictionary<Coordinate, number>(serialization);
        const visitedOdd = new SerializableDictionary<Coordinate, number>(serialization);
        const starting = ns.findOne(c => c === "S");
        if (!starting) {
            throw Error("Could not find starting point");
        }
        visitedEven.set(starting, 0);
        let step = 1;
        const howManySteps = 64;
        let lastVisited: Coordinate[] = [starting];
        while (step <= howManySteps) {
            const nextOdd = step % 2 === 1;
            const currentOdd = !nextOdd;
            const toVisit = currentOdd ? visitedOdd : visitedEven;
            const goingTo = nextOdd ? visitedOdd : visitedEven;
            // const startingPositions = toVisit.keys();
            const startingPositions = lastVisited;
            lastVisited = [];
            for (const startingFrom of startingPositions) {
                if (toVisit.get(startingFrom)! !== step-1) {
                    continue;
                }
                const destinations = getSurrounding(startingFrom);
                for (const destination of destinations) {
                    if (ns.get(destination) === "." && !goingTo.has(destination)) {
                        goingTo.set(destination, step);
                        lastVisited.push(destination);
                    }
                }
            }
            step++;
        }
        await resultOutputCallback((howManySteps % 2 == 0 ? visitedEven : visitedOdd).keys().length);
        // let result: any = 0
        // for (let i = 0; i < ns.length; i++) { 
        //     const x = ns[i];
        // }
        // await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrix(e => e as Cell);
        ns.setWrapping(true);
        const visitedEven = new SerializableDictionary<Coordinate, number>(serialization);
        const visitedOdd = new SerializableDictionary<Coordinate, number>(serialization);
        const starting = ns.findOne(c => c === "S");
        if (!starting) {
            throw Error("Could not find starting point");
        }
        visitedEven.set(starting, 0);
        let step = 1;
        const howManySteps = 26501365;
        let lastVisited: Coordinate[] = [starting];
        const interpolation = [];
        const rest = howManySteps % ns.size.x;
        const limit = rest + ns.size.x * 2;
        while (step <= limit) {
            const nextOdd = step % 2 === 1;
            const goingTo = nextOdd ? visitedOdd : visitedEven;
            const startingPositions = lastVisited;
            lastVisited = [];
            for (const startingFrom of startingPositions) {
                const destinations = getSurrounding(startingFrom);
                for (const destination of destinations) {
                    if ((ns.get(destination) === "." || ns.get(destination) === "S") && !goingTo.has(destination)) {
                        goingTo.set(destination, step);
                        lastVisited.push(destination);
                    }
                }
            }

            if (step % ns.size.x === rest) {
                interpolation.push({x: step, y: goingTo.keys().length});
            }
            // console.log(`${step} - ${goingTo.keys().length}`);
            step++;
        }
        await resultOutputCallback("{" + interpolation.map(e => `{${e.x},${e.y}}`).join(",") + "}")
        // await resultOutputCallback((howManySteps % 2 == 0 ? visitedEven : visitedOdd).keys().length);
    },
    {
        key: "step-counter",
        title: "Step Counter",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 21,
        exampleInput: `...........
        .....###.#.
        .###.##..#.
        ..#.#...#..
        ....#.#....
        .##..S####.
        .##..#...#.
        .......##..
        .##.#.####.
        .##..##.##.
        ...........`.replaceAll(" ", "")
    }
);