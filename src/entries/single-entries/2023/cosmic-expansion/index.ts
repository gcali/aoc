import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { sum } from "../../../../support/sequences";

const empty = (matrix: FixedSizeMatrix<string>): { columns: number[], rows: number[] } => {
    const columns = [];
    for (let y = 0; y < matrix.size.y; y++) {
        let isEmpty = true;
        for (let x = 0; x < matrix.size.x; x++) {
            if (matrix.get({ x, y }) !== ".") {
                isEmpty = false;
                break;
            }
        }
        if (isEmpty) {
            columns.push(y);
        }
    }
    const rows = [];
    for (let x = 0; x < matrix.size.x; x++) {
        let isEmpty = true;
        for (let y = 0; y < matrix.size.y; y++) {
            if (matrix.get({ x, y }) !== ".") {
                isEmpty = false;
                break;
            }
        }
        if (isEmpty) {
            rows.push(x);
        }
    }
    return { columns, rows };
}

export const cosmicExpansion = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const distances = calculateDistances(lines, 2);

        await resultOutputCallback(sum(distances));
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const distances = calculateDistances(lines, 1000000);

        await resultOutputCallback(sum(distances));
    },
    {
        key: "cosmic-expansion",
        title: "Cosmic Expansion",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 11,
        stars: 2,
        exampleInput: `...#......
.......#..
#.........
..........
......#...
.#........
.........#
..........
.......#..
#...#.....`
    }
);

function calculateDistances(lines: string[], emptySize: number) {
    const ns = new Parser(lines)
        .matrix(e => e);
    const { columns, rows } = empty(ns);
    const galaxies = ns.filter(e => ns.get(e) !== ".");
    const distances: number[] = [];
    for (let i = 0; i < galaxies.length; i++) {
        for (let j = i + 1; j < galaxies.length; j++) {
            let distance = 0;
            const a = galaxies[i];
            const b = galaxies[j];
            for (let k = Math.min(a.x, b.x); k < Math.max(a.x, b.x); k++) {
                if (rows.includes(k)) {
                    distance += emptySize;
                } else {
                    distance++;
                }
            }
            for (let k = Math.min(a.y, b.y); k < Math.max(a.y, b.y); k++) {
                if (columns.includes(k)) {
                    distance += emptySize;
                } else {
                    distance++;
                }
            }
            distances.push(distance);
        }
    }
    return distances;
}
