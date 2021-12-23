import BinaryHeap from "priorityqueue/lib/cjs";
import { PriorityQueue } from "priorityqueue/lib/cjs/PriorityQueue";
import { Coordinate } from "../../../../support/geometry";
import { permutationGenerator } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

type Amphi = "A" | "B" | "C" | "D";

type Room = 0 | 1 | 2 | 3;

type AmphiState = {
    amphiType: Amphi;
    position: Coordinate;
    destination: Room | null;
    hasLeftRoom: boolean;
    finished: boolean;
};

type State = {
    amphis: AmphiState[];
    cost: number;
};

const parseInput = (lines: string[]): State => {
    const amphis: AmphiState[] = [];
    for (const y of [2, 3]) {
        for (const x of [3, 5, 7, 9]) {
            const amphiType = lines[y][x];
            if (!["A", "B", "C", "D"].includes(amphiType)) {
                throw new Error("Invalid input");
            }
            amphis.push({
                amphiType: amphiType as Amphi,
                position: { x, y },
                destination: null,
                hasLeftRoom: false,
                finished: false
            });
        }
    }
    return {
        amphis,
        cost: 0
    };
};

export const amphipod = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const baseState = parseInput(lines);
        const destinations = [0, 0, 1, 1, 2, 2, 3, 3] as Room[];
        const startingStates = [...permutationGenerator(destinations)].map((p) => {
            const newState = {
                ...baseState, amphis: baseState.amphis.map((a, i) => ({
                    ...a,
                    destination: p[i]
                }))
            };
            return newState;

        });
        const queue = new BinaryHeap<State>({ comparator: (a, b) => b.cost - a.cost });
        const ns = lines.map((l) => parseInt(l, 10));
        const result: any = 0;
        for (const x of lines) {
        }
        for (const x of ns) {
        }
        await resultOutputCallback(result.amphis);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = lines.map((l) => parseInt(l, 10));
        const result: any = 0;
        for (const x of lines) {
        }
        for (const x of ns) {
        }
        await resultOutputCallback(result);
    },
    {
        key: "amphipod",
        title: "Amphipod",
        supportsQuickRunning: true,
        embeddedData: true
    }
);
