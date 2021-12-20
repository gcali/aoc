import { UnknownSizeField } from "../../../../support/field";
import { sumCoordinate } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";

type Cell = "#" | ".";

type Field = UnknownSizeField<Cell>;

const isCell = (s: string): s is Cell => (s === "#" || s === ".");

const parseInput = (lines: string[]): { lookup: Cell[], field: Field } => {
    const field = new UnknownSizeField<Cell>();
    const lookup = lines[0].split("") as Cell[];
    for (const c of lookup) {
        if (!isCell(c)) {
            throw new Error("Invalid cell in lookup " + c);
        }
    }

    const data = lines.slice(2);
    for (let row = 0; row < data.length; row++) {
        for (let col = 0; col < data[row].length; col++) {
            const cell = data[row][col];
            if (!isCell(cell)) {
                throw new Error("Invalid cell " + cell);
            }
            field.set({ x: col, y: row }, cell);
        }
    }

    return { field, lookup };
};

export const trenchMap = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseInput(lines);

        let field = input.field;
        const lookup = input.lookup;

        let emptyCell: Cell = ".";

        for (let i = 0; i < 2; i++) {
            ({ field, emptyCell } = iterateField(field, emptyCell, lookup));
        }

        const count = countLights(field);

        await resultOutputCallback(count);

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseInput(lines);

        let field = input.field;
        const lookup = input.lookup;

        let emptyCell: Cell = ".";

        for (let i = 0; i < 50; i++) {
            ({ field, emptyCell } = iterateField(field, emptyCell, lookup));
        }

        const count = countLights(field);

        await resultOutputCallback(count);
    },
    {
        key: "trench-map",
        title: "Trench Map",
        supportsQuickRunning: true,
        embeddedData: true
    }
);
function countLights(field: Field): number {
    const result = field.toMatrix();
    let count = 0;
    result.onEveryCellSync((c, e) => {
        if (e === "#") {
            count++;
        }
    });
    return count;
}

function iterateField(field: Field, emptyCell: Cell, lookup: Cell[]): { field: Field, emptyCell: Cell } {
    const boundaries = field.getBoundaries();

    const newField = new UnknownSizeField<Cell>();

    for (let row = boundaries.topLeft.y - 1; row < boundaries.topLeft.y + boundaries.size.y + 1; row++) {
        for (let col = boundaries.topLeft.x - 1; col < boundaries.topLeft.x + boundaries.size.x + 1; col++) {
            const coordinates = { x: col, y: row };
            const cells: Cell[] = [];
            for (const drow of [-1, 0, 1]) {
                for (const dcol of [-1, 0, 1]) {
                    cells.push(field.get(sumCoordinate(coordinates, { x: dcol, y: drow })) || emptyCell);
                }
            }
            const index = parseInt(cells.map((c) => c === "#" ? "1" : "0").join(""), 2);
            const newCell = lookup[index];
            newField.set({ x: col, y: row }, newCell);
        }
    }

    field = newField;
    if (emptyCell === ".") {
        emptyCell = lookup[0];
    } else {
        emptyCell = lookup[parseInt("111111111", 2)];
    }
    return { field, emptyCell };
}

