import { pow } from "../../../support/algebra";
import { entryForFile } from "../../entry";

const fromRowColumn = (row: number, column: number) => {
    const start = 1;
    const firstOfRow = (row - 1) * row / 2 + 1;
    const increments = column - 1;
    const rightDelta = (increments + row) * (increments + row + 1) / 2 - (row * (row + 1) / 2);
    return firstOfRow + rightDelta;
};

const parseLines = (lines: string[]): { row: number, column: number } => {
    const words = lines[0].split(" ");
    const rowIndex = words.indexOf("row") + 1;
    const columnIndex = words.indexOf("column") + 1;
    return {
        row: parseInt(words[rowIndex].slice(0, -1), 10),
        column: parseInt(words[columnIndex].slice(0, -1), 10)
    };
};

export const letItSnow = entryForFile(
    async ({ lines, resultOutputCallback }) => {
        const coordinates = parseLines(lines);
        const start = 20151125;
        const base = 252533;
        const mod = 33554393;
        const index = fromRowColumn(coordinates.row, coordinates.column);
        const factor = pow(BigInt(base), BigInt(index - 1), BigInt(mod));
        const result = (BigInt(start) * factor) % BigInt(mod);
        await resultOutputCallback(Number(result));
    },
    async ({ lines, outputCallback }) => {
        throw Error("Not implemented");
    },
    { key: "let-it-snow", title: "Let It Snow", stars: 2 }
);
