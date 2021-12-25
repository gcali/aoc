import BinaryHeap from "priorityqueue/lib/cjs";
import { Coordinate, manhattanDistance, serialization } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";
import { buildVisualizer } from "./visualizer";

type Amphi = "A" | "B" | "C" | "D";

type Room = 3 | 5 | 7 | 9;

const rooms: Room[] = [3, 5, 7, 9];

type AmphiState = {
    amphiType: Amphi;
    position: Coordinate;
    destination: Room;
    // hasLeftRoom: boolean;
    finished: boolean;
    id: number;
};

export type State = {
    amphis: AmphiState[];
    cost: number;
    father?: State;
    // grid: string[][];
};

const parseInput = (lines: string[], depth: number): State => {
    const amphis: AmphiState[] = [];
    let i = 0;
    for (let dy = 0; dy < depth; dy++) {
        const y = 2 + dy;
        for (const x of [3, 5, 7, 9]) {
            const amphiType = lines[y][x];
            if (!["A", "B", "C", "D"].includes(amphiType)) {
                throw new Error("Invalid input");
            }
            amphis.push({
                amphiType: amphiType as Amphi,
                position: { x, y },
                destination: ([3, 5, 7, 9] as Room[])[["A", "B", "C", "D"].indexOf(amphiType)],
                finished: false,
                id: i++
            });
        }
    }
    return {
        amphis,
        cost: 0,
    };
};

const serialize = (state: State): string => {
    const items = [
        state.amphis.map((a) => a).sort((a, b) => a.id - b.id).map((a) => ({s: `${a.amphiType}${a.finished}${a.position.x}~${a.position.y}`, a})).map((e) => e.s)
    ];
    return items.join("|");
};

const typeCost = (amphi: Amphi): number => {
    switch (amphi) {
        case "A": return 1;
        case "B": return 10;
        case "C": return 100;
        case "D": return 1000;
    }
};

type ReachResult = {c: Coordinate, cost: number; };

const canReach = (amphi: AmphiState, state: State, depth: number): ReachResult[] => {
    const isEmpty = (pos: Coordinate): boolean => {
        return state.amphis.filter((a) => a !== amphi && manhattanDistance(pos, a.position) === 0).length === 0;
    };
    if (amphi.finished) {
        return [];
    }
    if (rooms.some((r) => r === amphi.position.x)) {
        const others = state.amphis.filter((a) => a !== amphi && a.position.x === amphi.position.x && a.position.y < amphi.position.y);
        if (others.length > 0) {
            return [];
        }
        const steps = amphi.position.y - 1;
        const result: ReachResult[] = [];
        for (const dir of [-1, 1]) {
            let current = amphi.position.x;
            while (current + dir > 0 && current + dir < 12) {
                current += dir;
                if (!isEmpty({x: current, y: 1})) {
                    break;
                }
                if (!rooms.some((r) => r === current)) {
                    result.push({c: {x: current, y: 1}, cost: steps + Math.abs(amphi.position.x - current)});
                }
            }
        }
        return result;
    } else {
        const result: ReachResult[] = [];
        for (const dir of [-1, 1]) {
            let current = amphi.position.x;
            while (current + dir > 0 && current + dir < 12) {
                current += dir;
                if (!isEmpty({x: current, y: 1})) {
                    break;
                }
                if (rooms.some((r) => r === current)) {
                    const matching = state.amphis.filter((a) => a !== amphi && a.position.x === current);
                    if (matching.every((a) => a.amphiType === amphi.amphiType) && (amphi.destination === null || amphi.destination === current)) {
                        const lastEmpty = 1 + depth - matching.length;
                        result.push({
                            c: {x: current, y: lastEmpty},
                            cost: Math.abs(current - amphi.position.x) + lastEmpty - 1
                        });
                    }
                }
            }
        }

        return result;
    }
};

const printGrid = (currentResult: State, isSecond: boolean): string => {

            const grid = (isSecond ?
`#############
#...........#
###.#.#.#.###
  #.#.#.#.#
  #.#.#.#.#
  #.#.#.#.#
  #########  ` :
`#############
#...........#
###.#.#.#.###
  #.#.#.#.#
  #########  `).split("\n").map((l) => l.split(""));
            currentResult.amphis.forEach((a) => grid[a.position.y][a.position.x] = a.amphiType);
            return grid.map((l) => l.join("")).join("\n");
};

// const logHistory = async (endState: State, outputCallback: (s: string) => Promise<void>) => {
//     if (endState.father !== undefined) {
//         logHistory(endState.father, outputCallback);
//     }
//     const out = printGrid(endState);
//     await outputCallback(out);
// }

const stateList = (endState: State): State[] => {
    if (endState.father === undefined) {
        return [endState];
    }
    const res = stateList(endState.father);
    res.push(endState);
    return res;
};

export const amphipod = entryForFile(
    async ({ lines, screen, pause, resultOutputCallback }) => {
        const baseState = parseInput(lines, 2);
        const visited = new Set<string>();
        const queue = new BinaryHeap<State>({ comparator: (a, b) => b.cost - a.cost });
        queue.push(baseState);

        const vs = buildVisualizer(screen, pause);


        while (!queue.isEmpty()) {
            const current = queue.pop()!;
            const s = serialize(current);
            if (visited.has(s))  {
                continue;
            }
            visited.add(s);
            if (current.amphis.every((a) => a.finished)) {
                const states = stateList(current);
                await vs.showStates(states.map((e) => printGrid(e, false)));
                await resultOutputCallback(current.cost);
                return;
            }

            for (const amphi of current.amphis) {
                if (amphi.finished) {
                    continue;
                }
                const destinations = canReach(amphi, current, 2);
                for (const destination of destinations) {
                    const combinedState = combineStates(destination, current, amphi);
                    combinedState.father = current;
                    queue.push(combinedState);
                }
            }
        }

    },
    async ({ lines, screen, pause, resultOutputCallback }) => {
        lines.splice(3, 0, "  #D#C#B#A#  ", "  #D#B#A#C#  ");
        const baseState = parseInput(lines, 4);
        const visited = new Set<string>();
        const queue = new BinaryHeap<State>({ comparator: (a, b) => b.cost - a.cost });
        queue.push(baseState);

        const vs = buildVisualizer(screen, pause);

        while (!queue.isEmpty()) {
            const current = queue.pop()!;
            const s = serialize(current);
            if (visited.has(s))  {
                continue;
            }
            visited.add(s);
            if (current.amphis.every((a) => a.finished)) {
                const states = stateList(current);
                await vs.showStates(states.map((e) => printGrid(e, true)));
                await resultOutputCallback(current.cost);
                return;
            }

            for (const amphi of current.amphis) {
                if (amphi.finished) {
                    continue;
                }
                const destinations = canReach(amphi, current, 4);
                for (const destination of destinations) {
                    const combinedState = combineStates(destination, current, amphi);
                    combinedState.father = current;
                    queue.push(combinedState);
                }
            }
        }
    },
    {
        key: "amphipod",
        title: "Amphipod",
        supportsQuickRunning: true,
        embeddedData: true,
        suggestedDelay: 300
    }
);
function combineStates(destination: ReachResult, current: State, amphi: AmphiState): State {
    const isFinished = rooms.some((r) => r === destination.c.x);
    const combinedState = {
        amphis: current.amphis.map((a) => {
            if (a !== amphi) {
                if (isFinished && a.amphiType === amphi.amphiType) {
                    const res = {...a};
                    if (a.position.x === destination.c.x) {
                        res.finished = true;
                    }
                    res.destination = a.destination;
                    return res;
                }
                return a;
            }
            return {
                ...amphi,
                finished: isFinished,
                position: destination.c,
            };
        }),
        cost: current.cost + typeCost(amphi.amphiType) * destination.cost
    };
    return combinedState;
}

