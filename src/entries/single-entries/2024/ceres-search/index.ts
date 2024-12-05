import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { CCoordinate, Coordinate, directionList, directions, getFullSurrounding, getSurrounding } from "../../../../support/geometry";

type Cell = "X" | "M" | "A" | "S" | ".";

const isCell = (s: string): s is Cell => {
    const validValues: Cell[] = ["X", "M", "A", "S", "."];
    if (validValues.includes(s as Cell)) {
        return true;
    }
    return false;
}

const parseCell = (s: string): Cell => {
    if (isCell(s)) {
        return s;
    }
    throw new Error("Invalid cell");
}

type CellMatrix = FixedSizeMatrix<Cell>;

const findValidWords = (matrix: CellMatrix, c: Coordinate, toFind: Cell[]): number => {
    if (toFind.length === 0) {
        return 1;
    }
    if (matrix.get(c) !== toFind[0]) {
        return 0;
    }
    let result = 0;
    for (const surr of getFullSurrounding(c)) {
        const nested = findValidWords(matrix, surr, toFind.slice(1));
        result += nested;
    }
    return result;
}

const getWordDirection = (matrix: CellMatrix, c: Coordinate, direction: CCoordinate, length: number): string | null => {
    const result: string[] = [];

    for (let i = 0; i < length; i++) {
        const current = matrix.get(c);
        if (!current) {
            return null;
        }
        result.push(current);
        c = direction.sum(c);
    }
    return result.join("");
}

export const ceresSearch = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = new Parser(lines)
            .matrix(s => parseCell(s));

        let result = 0;

        input.onEveryCellSync((coordinate, cell) => {
            if (cell === "X") {
                for (const direction of directionList) {
                    const word = getWordDirection(input, coordinate, direction, 4);
                    if (word === "XMAS") {
                        result += 1;
                    }
                }
            }
            // result += findValidWords(input, coordinate, ["X", "M", "A", "S"]);
            // if (isValidWord(input, coordinate, ["X", "M", "A", "S"])) {
            //     result++;
            // }
        })

        await resultOutputCallback(result);
            
        // let result: any = 0
        // for (let i = 0; i < ns.length; i++) { 
        //     const x = ns[i];
        // }
        // await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = new Parser(lines)
            .matrix(s => parseCell(s));

        let result = 0;

        input.onEveryCellSync((coordinate, cell) => {
            if (cell === "A") {
                const topLeft = directions.upLeft.sum(coordinate);
                const topRight = directions.upRight.sum(coordinate);
                const first = getWordDirection(input, topLeft, directions.downRight, 3);
                const second = getWordDirection(input, topRight, directions.downLeft, 3);
                if ((first === "MAS" || first === "SAM") && (second === "MAS" || second === "SAM")) {
                    result += 1;
                }
                // for (const direction of directionList) {
                //     const word = getWordDirection(input, coordinate, direction, 4);
                //     if (word === "XMAS") {
                //         result += 1;
                //     }
                // }
            }
            // result += findValidWords(input, coordinate, ["X", "M", "A", "S"]);
            // if (isValidWord(input, coordinate, ["X", "M", "A", "S"])) {
            //     result++;
            // }
        })

        await resultOutputCallback(result);
    },
    {
        key: "ceres-search",
        title: "Ceres Search",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 4,
        stars: 2,
        exampleInput: exampleInput
    }
);