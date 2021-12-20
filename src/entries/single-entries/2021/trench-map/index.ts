import { UnknownSizeField } from "../../../../support/field";
import { sumCoordinate } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";

export const trenchMap = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        let field = new UnknownSizeField<"#" | ".">();
        const lookup = lines[0].split("") as Array<"#" | ".">;
        for (const c of lookup) {
            if (c !== "#" && c !== ".") {
                throw new Error("Invalid cell in lookup " + c);
            }
        }

        const data = lines.slice(2);
        for (let row = 0; row < data.length; row++) {
            for (let col = 0; col < data[row].length; col++) {
                const cell = data[row][col];
                if (cell !== "#" && cell !== ".") {
                    throw new Error("Invalid cell " + cell);
                }
                field.set({ x: col, y: row }, cell);
            }
        }

        for (let i = 0; i < 2; i++) {
            const boundaries = field.getBoundaries();

            const newField = new UnknownSizeField<"#" | ".">();

            const hasLogged = false;

            for (let row = boundaries.topLeft.y - 1; row < boundaries.topLeft.y + boundaries.size.y + 1; row++) {
                for (let col = boundaries.topLeft.x - 1; col < boundaries.topLeft.x + boundaries.size.x + 1; col++) {
                    const coordinates = { x: col, y: row };
                    const cells: Array<"#" | "."> = [];
                    for (const drow of [-1, 0, 1]) {
                        for (const dcol of [-1, 0, 1]) {
                            cells.push(field.get(sumCoordinate(coordinates, { x: dcol, y: drow })) || (i % 2 === 0 ? "." : "#"));
                        }
                    }
                    const index = parseInt(cells.map((c) => c === "#" ? "1" : "0").join(""), 2);
                    const newCell = lookup[index];
                    newField.set({ x: col, y: row }, newCell);
                }
            }

            field = newField;
        }

        const result = field.toMatrix();
        // console.log(result.toString((e) => e || "."));
        let count = 0;
        result.onEveryCellSync((c, e) => {
            if (e === "#") {
                count++;
            }
        });

        await resultOutputCallback(count);

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        let field = new UnknownSizeField<"#" | ".">();
        const lookup = lines[0].split("") as Array<"#" | ".">;
        for (const c of lookup) {
            if (c !== "#" && c !== ".") {
                throw new Error("Invalid cell in lookup " + c);
            }
        }

        const data = lines.slice(2);
        for (let row = 0; row < data.length; row++) {
            for (let col = 0; col < data[row].length; col++) {
                const cell = data[row][col];
                if (cell !== "#" && cell !== ".") {
                    throw new Error("Invalid cell " + cell);
                }
                field.set({ x: col, y: row }, cell);
            }
        }

        for (let i = 0; i < 50; i++) {
            const boundaries = field.getBoundaries();

            const newField = new UnknownSizeField<"#" | ".">();

            const hasLogged = false;

            for (let row = boundaries.topLeft.y - 1; row < boundaries.topLeft.y + boundaries.size.y + 1; row++) {
                for (let col = boundaries.topLeft.x - 1; col < boundaries.topLeft.x + boundaries.size.x + 1; col++) {
                    const coordinates = { x: col, y: row };
                    const cells: Array<"#" | "."> = [];
                    for (const drow of [-1, 0, 1]) {
                        for (const dcol of [-1, 0, 1]) {
                            cells.push(field.get(sumCoordinate(coordinates, { x: dcol, y: drow })) || (i % 2 === 0 ? "." : "#"));
                        }
                    }
                    const index = parseInt(cells.map((c) => c === "#" ? "1" : "0").join(""), 2);
                    const newCell = lookup[index];
                    // if (row < boundaries.topLeft.y - 5 && !hasLogged) {
                    //     hasLogged = true;
                    //     console.log(coordinates);
                    //     console.log(cells);
                    //     console.log(index);
                    //     console.log(newCell);
                    // }
                    newField.set({ x: col, y: row }, newCell);
                }
            }

            field = newField;
        }

        const result = field.toMatrix();
        // console.log(result.toString((e) => e || "."));
        let count = 0;
        result.onEveryCellSync((c, e) => {
            if (e === "#") {
                count++;
            }
        });

        await resultOutputCallback(count);
    },
    {
        key: "trench-map",
        title: "Trench Map",
        supportsQuickRunning: true,
        embeddedData: true
    }
);
