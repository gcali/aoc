import { UnknownSizeField } from "../../../../support/field";
import { Coordinate, directions, manhattanDistance, serialization, sumCoordinate } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { entryForFile } from "../../../entry";

const calculateStep = (head: Coordinate, tail: Coordinate) => {
    if (Math.abs(head.x - tail.x) <= 1 && Math.abs(head.y - tail.y) <= 1) {
        return {x: 0, y: 0};
    }
    return {x: Math.sign(head.x - tail.x), y: Math.sign(head.y - tail.y)};
}

type Instruction = {
    direction: Coordinate;
    steps: number;
}

const parseInput = (lines: string[]): Instruction[] => {
    const lookup: {[key: string]: Coordinate} = {
        "R": directions.right,
        "L": directions.left,
        "U": directions.up,
        "D": directions.down
    };

    return lines.map(line => {
        const [rawDir, rawSteps] = line.split(" ");
        const steps = parseInt(rawSteps, 10);
        const dir = lookup[rawDir];
        return {
            steps,
            direction: dir
        };
    })
}

export const ropeBridge = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        await resultOutputCallback(findVisits(2, lines));
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        await resultOutputCallback(findVisits(10, lines));
    },
    {
        key: "rope-bridge",
        title: "Rope Bridge",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);

function findVisits(howManyKnots: number, lines: string[]) {
    const basePosition = { x: 0, y: 0 };
    const knots: Coordinate[] = [];
    for (let i = 0; i < howManyKnots; i++) {
        knots.push({ ...basePosition });
    }

    const instructions = parseInput(lines);
    const visited = new Set<string>();
    visited.add(serialization.serialize(basePosition));
    for (const instruction of instructions) {
        for (let i = 0; i < instruction.steps; i++) {
            for (let i = 0; i < howManyKnots; i++) {
                const currentPosition = knots[i];
                const direction = i === 0 ? instruction.direction : calculateStep(knots[i - 1], currentPosition);
                const newPosition = sumCoordinate(direction, currentPosition);
                knots[i] = newPosition;
            }
            visited.add(serialization.serialize(knots[howManyKnots - 1]));
        }
    }
    const result = visited.size;
    return result;
}
