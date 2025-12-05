import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { Coordinate, getFullSurrounding } from "../../../../support/geometry";
import { exampleInput } from "./example";

type Cell = "@" | ".";

type DepartmentField = FixedSizeMatrix<Cell>;

const isCell = (c: string | null | undefined): c is Cell => c === "@" || c === ".";

const parseInput = (lines: string[]): DepartmentField => new Parser(lines)
            .matrix(e => {
                if (isCell(e)) {
                    return e;
                }
                throw new Error("Invalid cell")
            });

const isAccessible = (field: DepartmentField, c: Coordinate): boolean => {
    const cell = field.get(c);
    if (cell !== "@") {
        throw new Error("Invalid cell");
    }
    const fullSurrounding = getFullSurrounding(c);
    const surroundingPapers = fullSurrounding.map(x => field.get(x)).filter(c => c === "@").length;
    return surroundingPapers < 4;
}

const findAccessible = (field: DepartmentField): Coordinate[] => {
    return field.filter((c, e) => e === "@").filter(c => isAccessible(field, c));
}

const removeFromField = (field: DepartmentField, cs: Coordinate[]) => {
    for (const c of cs) {
        field.set(c, ".");
    }
}

export const printingDepartment = entryForFile(
    //00:07:27
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const field = parseInput(lines);
        const accessible = findAccessible(field).length;
        await resultOutputCallback(accessible);
    },
    //00:11:12
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const field = parseInput(lines);
        let result = 0;
        while (true) {
            const accessible = findAccessible(field);
            if (accessible.length > 0) {
                result += accessible.length;
                removeFromField(field, accessible);
            } else {
                break;
            }
        }
        await resultOutputCallback(result);
    },
    {
        key: "printing-department",
        title: "Printing Department",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 4,
        exampleInput: exampleInput,
        stars: 2,
    }
);