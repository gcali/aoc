import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { areArraysEqual } from "../../../../support/sequences";
import { FixedSizeMatrix } from "../../../../support/matrix";

const findReflection = (sizeLimit: number, lineGetter: (n: number) => string[], skip?: number | null) => {
    for (let candidate = 0; candidate < sizeLimit - 1; candidate++) {
        if (candidate === skip) {
            continue;
        }
        let foundDifferent = false;
        let matches = 0;
        for (let y = 0; y < sizeLimit; y++) {
            const baseCol = candidate - y;
            const otherCol = candidate + y + 1;
            if ([baseCol, otherCol].every(e => e >= 0 && e < sizeLimit)) {
                const a = lineGetter(baseCol);
                const b = lineGetter(otherCol);
                if (!areArraysEqual(a, b, (a, b) => a === b)) {
                    foundDifferent = true;
                    break;
                } else {
                    matches++;
                }
            } else {
            }
        }
        if (matches > 0 && !foundDifferent) {
            return candidate;
        }
    }
    return null;
}

export const pointOfIncidence = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const matrixes = new Parser(lines)
            .group("")
            .groupMap(e => e.matrix(e => e))
            .run();

        let result = 0;

        for (const ns of matrixes) {
            const horizontalReflection = findReflection(ns.size.y, e => ns.getRow(e));
            const verticalReflection = findReflection(ns.size.x, e => ns.getColumn(e));
            if (horizontalReflection !== null) {
                result += (horizontalReflection + 1) * 100;
            } else if (verticalReflection !== null) {
                result += (verticalReflection + 1);
            }
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const matrixes = new Parser(lines)
            .group("")
            .groupMap(e => e.matrix(e => e))
            .run();

        let result = 0;

        let i = 0;
        for (const ns of matrixes) {
            result += findReflectionWithSmudge(ns, i++);
            // break;
        }
        await resultOutputCallback(result);
    },
    {
        key: "point-of-incidence",
        title: "Point of Incidence",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 13,
        stars: 2,
        exampleInput: `#.##..##.
..#.##.#.
##......#
##......#
..#.##.#.
..##..##.
#.#.##.#.

#...##..#
#....#..#
..##..###
#####.##.
#####.##.
..##..###
#....#..#`
    }
);

function findReflectionWithSmudge(ns: FixedSizeMatrix<string>, i: number) {
    const oldHorizontal = findReflection(ns.size.y, e => ns.getRow(e));
    const oldVertical = findReflection(ns.size.x, e => ns.getColumn(e));
    for (let x = 0; x < ns.size.x; x++) {
        for (let y = 0; y < ns.size.y; y++) {
            const current = ns.get({x,y})!;
            const res = current === "." ? "#" : ".";
            ns.set({x,y}, res);
            try {
                const horizontalReflection = findReflection(ns.size.y, e => ns.getRow(e), oldHorizontal);
                const verticalReflection = findReflection(ns.size.x, e => ns.getColumn(e), oldVertical);
                if (horizontalReflection !== null) {
                    return (horizontalReflection + 1) * 100;
                } else if (verticalReflection !== null) {
                    return (verticalReflection + 1);
                }
            } finally {
                ns.set({x,y}, current);
            }
        }
    }
    throw new Error("Didn't find a reflection point");
}
