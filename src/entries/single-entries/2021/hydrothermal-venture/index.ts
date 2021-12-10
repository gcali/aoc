import { UnknownSizeField } from "../../../../support/field";
import { Coordinate, isSameCoordinate } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";
import { buildVisualizer } from "./visualizer";

const parseInput = (lines: string[]): Array<{ from: Coordinate, to: Coordinate }> => {
    return lines.map((line) => {
        const [_, fromX, fromY, toX, toY] = line.match(/(\d*),(\d*).*?(\d*),(\d*)/)!.map((e) => parseInt(e, 10));
        return {
            from: { x: fromX, y: fromY },
            to: { x: toX, y: toY }
        };
    });
};

export const hydrothermalVenture = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback, screen, pause, mediaQuery }) => {

        const vs = buildVisualizer(screen, pause, mediaQuery);
        const field = new UnknownSizeField<number>();
        const input = parseInput(lines);

        for (const c of input) {
            if (c.from.x !== c.to.x && c.from.y !== c.to.y) {
                continue;
            }
            const current = c.from;
            while (!isSameCoordinate(current, c.to)) {
                field.set(current, (field.get(current) || 0) + 1);
                current.x += Math.sign(c.to.x - c.from.x);
                current.y += Math.sign(c.to.y - c.from.y);
            }
            field.set(current, (field.get(current) || 0) + 1);
        }
        let count = 0;
        const matrix = field.toMatrix();
        await matrix.onEveryCell(async (c, e) => {
            if (e && e > 1) {
                count++;
            }
        });
        await vs.show(matrix);
        await resultOutputCallback(count);
    },
    async ({ lines, outputCallback, resultOutputCallback, screen, pause, mediaQuery }) => {
        const vs = buildVisualizer(screen, pause, mediaQuery);
        const field = new UnknownSizeField<number>();
        const input = parseInput(lines);
        for (const c of input) {
            const current = c.from;
            while (!isSameCoordinate(current, c.to)) {
                field.set(current, (field.get(current) || 0) + 1);
                current.x += Math.sign(c.to.x - c.from.x);
                current.y += Math.sign(c.to.y - c.from.y);
            }
            field.set(current, (field.get(current) || 0) + 1);
        }
        let count = 0;
        const matrix = field.toMatrix();
        await matrix.onEveryCell(async (c, e) => {
            if (e && e > 1) {
                count++;
            }
        });
        await vs.show(matrix);
        await resultOutputCallback(count);
    },
    {
        key: "hydrothermal-venture",
        title: "Hydrothermal Venture",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);
