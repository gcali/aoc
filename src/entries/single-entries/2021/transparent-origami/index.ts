import { UnknownSizeField } from "../../../../support/field";
import { Coordinate, CoordinateSet, serialization } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";
import { buildVisualizer } from "./visualizer";

export const transparentOrigami = entryForFile(
    async ({ lines, resultOutputCallback, isQuickRunning, screen, pause }) => {
        const { points, folds } = parseInput(lines);

        const foldedPoints = applyFolds(points, folds.slice(0, 1));

        if (!isQuickRunning) {
            const matrix = mapToMatrix(foldedPoints);
            const vs = buildVisualizer(screen, pause, true);
            await vs.show(matrix);
        }

        await resultOutputCallback(foldedPoints.size);

    },
    async ({ lines, resultOutputCallback, screen, pause }) => {
        const { points, folds } = parseInput(lines);

        const foldedPoints = applyFolds(points, folds);

        const matrix = mapToMatrix(foldedPoints);

        if (screen) {
            const vs = buildVisualizer(screen, pause, false);
            await vs.show(matrix);
            await resultOutputCallback(await vs.getText());
        } else {
            await resultOutputCallback(matrix.toString((e) => e || " "));
        }
    },
    {
        key: "transparent-origami",
        title: "Transparent Origami",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);

function mapToMatrix(set: CoordinateSet) {
    const field = new UnknownSizeField<"#">();

    set.forEach((p) => field.set(p, "#"));

    const matrix = field.toMatrix();
    return matrix;
}

function applyFolds(points: Coordinate[], foldsToExecute: Array<{ coordinate: "x" | "y"; value: number; }>) {
    let set = new CoordinateSet(points);

    for (const fold of foldsToExecute) {
        set = set.sameTypeMap((p) => {
            const v = p[fold.coordinate];
            p[fold.coordinate] = v < fold.value ?
                v : fold.value - (v - fold.value);
            return p;
        });
    }
    return set;
}

function parseInput(lines: string[]) {
    const points = lines.filter((l) => l && !l.startsWith("fold")).map((line) => {
        const [x, y] = line.split(",").map((e) => parseInt(e, 10));
        return { x, y };
    });
    const folds = lines.filter((l) => l.startsWith("fold")).map((line) => {
        const token = line.split(" ")[2];
        const [coordinate, rawValue] = token.split("=");
        return {
            coordinate: coordinate as "x" | "y",
            value: parseInt(rawValue, 10)
        };
    });
    return { points, folds };
}

