import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";

type Race = {
    time: number;
    distance: number;
}

const adjustSolution = (n: number, ceilOrFloor: (n: number) => number, adjustment: number): number => {
    const truncated = ceilOrFloor(n);
    if (n !== truncated) {
        return truncated;
    } else {
        return truncated + adjustment;
    }
}

const findSolutions = (race: Race): [number, number] => {
    const b = race.time;
    const c = race.distance;

    const delta = b*b -4*c;

    const firstSolution = (race.time + Math.sqrt(delta))/2;
    const secondSolution = (race.time - Math.sqrt(delta))/2;

    const minSolution = adjustSolution(secondSolution, Math.ceil, 1);
    const maxSolution = adjustSolution(firstSolution, Math.floor, -1);

    return [minSolution, maxSolution];
}

const findNumberOfSolutions = (race: Race): number => {
    const [a, b] = findSolutions(race);
    const delta = b - a + 1;
    return delta;
}

export const waitForIt = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const races = new Parser(lines)
            .extractAllNumbers()
            .pivot()
            .startLabeling()
            .label(e => e, "time")
            .label(e => e, "distance")
            .run();

        const result = races.reduce((acc, next) => acc * findNumberOfSolutions(next), 1);

        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const race = new Parser(lines)
            .remove(" ")
            .extractAllNumbers()
            .flat()
            .startSimpleLabeling()
            .label(e => e, "time")
            .label(e => e, "distance")
            .run();

        const result = findNumberOfSolutions(race);

        await resultOutputCallback(result);
    },
    {
        key: "wait-for-it",
        title: "Wait For It",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 6,
        stars: 2,
        exampleInput: `Time:      7  15   30
Distance:  9  40  200`
    }
);