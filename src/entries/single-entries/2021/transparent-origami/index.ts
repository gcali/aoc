import { UnknownSizeField } from "../../../../support/field";
import { serialization } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";

export const transparentOrigami = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
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

        let set = new Set<string>();
        points.map(serialization.serialize).forEach((p) => set.add(p));

        for (const fold of folds.slice(0, 1)) {
            const newSet = new Set<string>();
            set.forEach((rawP) => {
                const p = serialization.deserialize(rawP);
                p[fold.coordinate] = p[fold.coordinate] < fold.value ?
                    p[fold.coordinate] : fold.value - (p[fold.coordinate] - fold.value);
                set.add(serialization.serialize(p));
                newSet.add(serialization.serialize(p));
            });
            set = newSet;
        }

        await resultOutputCallback(set.size);

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
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

        let set = new Set<string>();
        points.map(serialization.serialize).forEach((p) => set.add(p));

        for (const fold of folds) {
            const newSet = new Set<string>();
            set.forEach((rawP) => {
                const p = serialization.deserialize(rawP);
                p[fold.coordinate] = p[fold.coordinate] < fold.value ?
                    p[fold.coordinate] : fold.value - (p[fold.coordinate] - fold.value);
                set.add(serialization.serialize(p));
                newSet.add(serialization.serialize(p));
            });
            set = newSet;
        }

        const field = new UnknownSizeField<"#">();

        set.forEach(p => field.set(serialization.deserialize(p), "#"));

        const matrix = field.toMatrix();

        await resultOutputCallback(matrix.toString(e => e || "."));
    },
    {
        key: "transparent-origami",
        title: "Transparent Origami",
        supportsQuickRunning: true,
        embeddedData: true
    }
);
