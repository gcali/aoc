import { entryForFile } from "../../../entry";
import {calculateDistances} from "../../../../support/labyrinth";
import { Coordinate, getSurrounding, manhattanDistance, serialization } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import Best, { CustomBest, SimpleBest } from "../../../../support/best";

const parseLines = (lines: string[]) => {
    let start: Coordinate | null = null;
    let end: Coordinate | null = null;
    const field: FixedSizeMatrix<number> = new FixedSizeMatrix<number>({
        y: lines.length, 
        x: lines[0].length
    });

    for (let y = 0; y < lines.length; y++) {
        for (let x = 0; x < lines[y].length; x++) {
            const cell = lines[y][x];
            if (cell === "S") {
                start = {x,y};
            } else if (cell === "E") {
                end = {x,y};
            }
            const value = cell === "S" ? "a" : (cell === "E" ? "z" : cell);
            const elevation = value.charCodeAt(0) - "a".charCodeAt(0);
            field.set({x, y}, elevation);
        }
    }

    if (!start || !end) {
        throw new Error("Could not find start or end points");
    }
    return {start, end, field};
}

//         lines = 
// `Sabqponm
// abcryxxl
// accszExk
// acctuvwj
// abdefghi`.split("\n");

export const hillClimbingAlgorithm = entryForFile(
    async ({ lines, resultOutputCallback }) => {
        const {start, end, field} = parseLines(lines);
        const distances = calculateDistances(
            field.get.bind(field),
            (s, e) => {
                const to = field.get(e);
                if (to === undefined || to - s.cell > 1) {
                    return null;
                }
                return manhattanDistance(s.coordinate, e) + (s.distance || 0);
            },
            getSurrounding,
            start,
            e => manhattanDistance(e.coordinate, end) === 0
        );

        await resultOutputCallback(distances.map(end));
    },
    async ({ lines, resultOutputCallback, pause }) => {
        const {end, field} = parseLines(lines);
        const bestStart = new SimpleBest<number>((a, b) => b - a);
        const starts = field.filter((c, e) => e === 0);
        for (const start of starts) {
            await pause();
            const distances = calculateDistances(
                field.get.bind(field),
                (s, e) => {
                    const to = field.get(e);
                    if (to === undefined || to - s.cell > 1) {
                        return null;
                    }
                    return manhattanDistance(s.coordinate, e) + (s.distance || 0);
                },
                getSurrounding,
                start,
                e => manhattanDistance(e.coordinate, end) === 0
            );
            const res = distances.map(end);
            if (res !== null) {
                bestStart.add(res);
            }
        }

        await resultOutputCallback(bestStart.currentBest);
    },
    {
        key: "hill-climbing-algorithm",
        title: "Hill Climbing Algorithm",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);