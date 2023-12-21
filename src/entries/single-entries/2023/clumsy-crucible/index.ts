import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { CCoordinate, Coordinate, directions, manhattanDistance, rotate, serialization } from "../../../../support/geometry";
import { Heap, Lifo, Queuable, Queue, SerializableDictionary } from "../../../../support/data-structure";
import { sum } from "../../../../support/sequences";
import { start } from "repl";
import { FixedSizeMatrix } from "../../../../support/matrix";

type State = {
    position: Coordinate;
    direction: CCoordinate;
    heatLoss: number;
    // canStepFor: number;
}

export const clumsyCrucible = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrixNumbers(undefined);

        const bestDestination = getBestDestination(ns, 3, 0);

        await resultOutputCallback(bestDestination);
        
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .matrixNumbers(undefined);

        const bestDestination = getBestDestination(ns, 10, 3);

        await resultOutputCallback(bestDestination);
    },
    {
        key: "clumsy-crucible",
        title: "Clumsy Crucible",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 17,
        stars: 2,
        exampleInput: `2413432311323
3215453535623
3255245654254
3446585845452
4546657867536
1438598798454
4457876987766
3637877979653
4654967986887
4564679986453
1224686865563
2546548887735
4322674655533`
    }
);

function getBestDestination(ns: FixedSizeMatrix<number>, maxSteps: number, minSteps: number) {
    const queue: Queuable<State> = new Heap<State>((a, b) => b.heatLoss - a.heatLoss);

    queue.add({
        position: { x: 0, y: 0 },
        direction: directions.left,
        heatLoss: 0,
    });

    queue.add({
        position: { x: 0, y: 0 },
        direction: directions.up,
        heatLoss: 0,
    });

    const visited = new SerializableDictionary<State, number>(
        {
            serialize(e) {
                return `${serialization.serialize(e.direction)}_${serialization.serialize(e.position)}`;
            },
            deserialize(e) {
                throw new Error("Not implemented");
            }
        }
    );

    const destination = { x: ns.size.x - 1, y: ns.size.y - 1 };
    let bestDestination = undefined;
    while (!queue.isEmpty) {
        const current = queue.get()!;
        if (bestDestination && current.heatLoss >= bestDestination) {
            continue;
        }
        const existing = visited.get(current);
        if (existing !== undefined && existing <= current.heatLoss) {
            continue;
        }
        visited.set(current, current.heatLoss);
        if (manhattanDistance(current.position, destination) === 0) {
            if (bestDestination === undefined) {
                bestDestination = current.heatLoss;
            }
            bestDestination = Math.min(current.heatLoss, bestDestination);
            continue;
        }
        const turnDirections = [
            rotate(current.direction, "Clockwise"),
            rotate(current.direction, "Counterclockwise"),
        ];
        for (const direction of turnDirections) {
            let newStart = { ...current, direction };
            for (let i = 0; i < maxSteps; i++) {
                newStart = { ...newStart, position: newStart.direction.sum(newStart.position) };
                const newHeat = ns.get(newStart.position);
                if (newHeat === undefined) {
                    break;
                }
                newStart.heatLoss += newHeat;
                if (i >= minSteps) {
                    queue.add(newStart);
                }
            }
        }
    }
    return bestDestination;
}
