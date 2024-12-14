import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";
import { CellWithDistance, calculateDistances } from "../../../../support/labyrinth";
import { Coordinate, getSurrounding, serialization } from "../../../../support/geometry";
import { DefaultDict, Queue } from "../../../../support/data-structure";

export const hoofIt = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrixNumbers(undefined);

        const startingPoints = ns.filter((c, e) => e === 0);
        let totalScore = 0;
        for (const startingPoint of startingPoints) {
            const distances = calculateDistances(
                c => ns.get(c),
                (start, endCoordinate) => {
                    const end = ns.get(endCoordinate);
                    if (end !== start.cell + 1) {
                        return null;
                    }
                    return end - start.cell + (start.distance || 0);
                },
                getSurrounding,
                startingPoint
            );
            console.log(distances);
            const score = distances.list.filter(e => e.distance === 9).length;
            totalScore += score;
        }
        await resultOutputCallback(totalScore);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrixNumbers(undefined);

        const startingPoints = ns.filter((c, e) => e === 0);
        let totalScore = 0;
        for (const startingPoint of startingPoints) {
            const parents = new DefaultDict<Coordinate, Coordinate[]>(() => [], serialization);
            const queue = new Queue<Coordinate>();
            queue.add(startingPoint);
            while (!queue.isEmpty) {
                const currentNode = queue.get()!;
                const currentValue = ns.getUnsafe(currentNode);
                for (const s of getSurrounding(currentNode)) {
                    const sValue = ns.get(s);
                    if (currentValue + 1 === sValue) {
                        const existingParents = parents.ensureAndGet(s);
                        if (existingParents.length === 0) {
                            queue.add(s);
                        }
                        existingParents.push(currentNode);
                    }
                }
            }
            const findPaths = (c: Coordinate): number => {
                const value = ns.getUnsafe(c);
                if (value === 0) {
                    return 1;
                }
                const cParents = parents.get(c);
                let nestedPaths = 0;
                for (const p of cParents) {
                    const n = findPaths(p);
                    nestedPaths += n;
                }
                return nestedPaths;
            }
            const endPoints = ns.filter((c, e) => e === 9);
            let howMany = 0;
            for (const endPoint of endPoints) {
                const currentParents = parents.get(endPoint);
                if (currentParents.length === 0) {
                    continue;
                }
                howMany += findPaths(endPoint);
            }
            totalScore += howMany;
        }
        await resultOutputCallback(totalScore);
    },
    {
        key: "hoof-it",
        title: "Hoof It",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 10,
        exampleInput,
        stars: 2
    }
);