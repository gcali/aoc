import { Queue } from "../../../../support/data-structure";
import { subsetGenerator } from "../../../../support/sequences";
import { TimeCalculator } from "../../../../support/time";
import { entryForFile } from "../../../entry";

const exampleInput = `Valve AA has flow rate=0; tunnels lead to valves DD, II, BB
Valve BB has flow rate=13; tunnels lead to valves CC, AA
Valve CC has flow rate=2; tunnels lead to valves DD, BB
Valve DD has flow rate=20; tunnels lead to valves CC, AA, EE
Valve EE has flow rate=3; tunnels lead to valves FF, DD
Valve FF has flow rate=0; tunnels lead to valves EE, GG
Valve GG has flow rate=0; tunnels lead to valves FF, HH
Valve HH has flow rate=22; tunnel leads to valve GG
Valve II has flow rate=0; tunnels lead to valves AA, JJ
Valve JJ has flow rate=21; tunnel leads to valve II`;

type Valve = {
    label: string;
    flow: number;
    path: {[key: string]: number};
}

type CaveLookup = {[key: string]: Valve};

type CaveState = {
    openValves: Set<string>;
    lookup: CaveLookup;
    time: number;
    flow: number;
    currentPosition: string;
    moves: string[];
}

const parseLines = (lines: string[]): Valve[] => {
    const base = lines.map(line => {
        const tokens = line.match(/Valve ([A-Za-z]*).*rate=(\d*).*valves? (.*)/);
        if (!tokens) {
            throw new Error("Could not parse line " + line);
        }
        return {
            label: tokens[1],
            flow: parseInt(tokens[2], 10),
            connectedTo: tokens[3].split(", ")
        };
    });

    const distances: {[key: string]: number} = {};

    const serialized = (from: string, to: string) => [from,to].sort().join("_");

    for (const valve of base) {
        for (const connected of valve.connectedTo) {
            distances[serialized(valve.label,connected)] = 1;
        }
    }

    for (const candidate of base) {
        for (const from of base) {
            if (from === candidate) {
                continue;
            }
            for (const to of base) {
                if (to === candidate || from === to) {
                    continue;
                }
                const existingDistance = distances[serialized(from.label, to.label)];
                const firstStep = distances[serialized(from.label, candidate.label)];
                const secondStep = distances[serialized(candidate.label, to.label)];
                if (firstStep === undefined || secondStep === undefined) {
                    continue;
                }
                if (existingDistance === undefined || existingDistance > firstStep + secondStep) {
                    distances[serialized(from.label, to.label)] = firstStep + secondStep;
                }
            }
        }
    }

    const valves = [];

    for (const from of base) {
        const valve: Valve = {
            flow: from.flow,
            label: from.label,
            path: {}
        };
        for (const to of base) {
            if (to === from) {
                continue;
            }
            valve.path[to.label] = distances[serialized(from.label, to.label)];
        }
        valves.push(valve);
    }

    return valves;

}

class Cave {
    private state: CaveState;

    constructor(private valves: Valve[], private timeLimit: number, state?: CaveState) {
        if (!state) {
            state = {
                openValves: new Set<string>(),
                lookup: valves.reduce((acc, next) => {
                    acc[next.label] = next;
                    return acc;
                }, {} as CaveLookup),
                time: 0,
                flow: 0,
                currentPosition: "AA",
                moves: []
            }
        }
        this.state = {
            ...state,
            moves: [...state.moves]
        };
    }

    public getValveState(): string {
        return [...this.state.openValves].sort().join("_");
    }

    public get bestFlow(): number {
        const waiting = this.passTime();
        if (waiting === null) {
            throw new Error("Should not happen");
        }
        return waiting.flow;
    }

    public get flow() {
        return this.state.flow;
    }

    private passTime(ticks?: number): Cave | null {
        const waitFor = ticks ? ticks : this.timeLimit - this.state.time;
        const remainingTime = this.timeLimit - (this.state.time + waitFor);
        if (remainingTime < 0) {
            return null;
        }
        return new Cave(this.valves, this.timeLimit, {
            ...this.state,
            time: this.state.time + waitFor,
            flow: this.flow + [...this.state.openValves].reduce((acc, next) => {
                return acc + (this.state.lookup[next].flow * waitFor);
            }, 0)
        })
    }

    private goTo(destination: string): Cave | null {
        const current = this.state.lookup[this.state.currentPosition];
        const distance = current.path[destination];
        if (distance === undefined) {
            throw new Error(`Could not find destination from ${this.state.currentPosition} to ${destination}`);
        }
        const res = new Cave(this.valves, this.timeLimit, {
            ...this.state,
            currentPosition: destination
        }).passTime(distance);
        if (res !== null) {
            res.state.moves.push(`->${destination}[${distance}]{${res.flow}}`);
        }
        return res;
    }

    public open(): Cave | null {
        if (this.state.openValves.has(this.state.currentPosition)) {
            throw new Error("Cannot open an already open valve");
        }
        const res = new Cave(this.valves, this.timeLimit, {
            ...this.state,
            openValves: new Set<string>(this.state.openValves)
        }).passTime(1);
        if (res === null) {
            return res;
        }
        res.state.openValves.add(this.state.currentPosition);
        res.state.moves.push(`%{${res.flow}}`);
        return res;
    }

    public getMoves(): string[] {
        return this.state.moves;
    }

    public goToAndOpen(destination: string): Cave | null {
        const to = this.goTo(destination);
        if (to === null) {
            return null;
        }
        return to.open();
    }

    public get closedValves(): string[] {
        return this.valves.filter(v => v.flow > 0 && !this.state.openValves.has(v.label)).map(e => e.label);
    }
}

const getBestFlow = (valves: Valve[], time: number, interesting: Set<string>) => {
    const cave = new Cave(valves, time);
    const queue = new Queue<Cave>();
    queue.add(cave);
    let bestFlow = 0;
    let bestCave = cave;
    const cache: {[key: string]: number} = {};
    while (!queue.isEmpty) {
        const current = queue.get()!;
        if (current.bestFlow > bestFlow) {
            bestFlow = current.bestFlow;
            bestCave = current;
        }
        for (const candidate of current.closedValves) {
            if (!interesting.has(candidate)) {
                continue;
            }
            const resultState = current.goToAndOpen(candidate);
            if (resultState) {
                const flow = resultState.bestFlow;
                const cached = cache[resultState.getValveState()] * .75;
                if (cached && flow <= cached) {
                    continue;
                }
                cache[resultState.getValveState()] = flow;
                queue.add(resultState);
            }
        }
    }
    return {bestFlow, bestCave};
}

export const proboscideaVolcanium = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const valves = parseLines(lines);
        const {bestFlow} = getBestFlow(valves, 30, new Set<string>(valves.map(v => v.label)));
        await resultOutputCallback(bestFlow);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const cache: {[key: string]: number} = {};
        const queue = new Queue<Cave>();
        const valves = parseLines(lines);
        const interestingValves = valves.filter(v => v.flow > 0).map(v => v.label);
        const subsets = subsetGenerator(interestingValves, 0);
        let bestFlow = 0;
        let caves: Cave[] = [];
        let i = 0;
        const size = 2 ** interestingValves.length;
        let skipped = 0;
        const visited = new Set<string>();
        for (const mySubset of subsets) {
            i++;
            if (i % 10 === 0) {
                await outputCallback(`Progress: (${i/size*100}%) [skipped: ${skipped}]`);
            }
            const myInteresting = new Set<string>(mySubset);
            const elephantInteresting = new Set<string>(interestingValves.filter(e => !myInteresting.has(e)));
            const keys = [myInteresting, elephantInteresting].map(e => [...e].sort().join("_"));
            if (keys.some(e => visited.has(e))) {
                skipped++;
                continue;
            }
            keys.forEach(e => visited.add(e));
            const {bestFlow: myBest, bestCave: myCave } = getBestFlow(valves, 26, myInteresting);
            const {bestFlow: elephantBest, bestCave: elephantCave }  = getBestFlow(valves, 26, elephantInteresting);
            if (myBest + elephantBest > bestFlow) {
                bestFlow = myBest + elephantBest;
                caves = [myCave, elephantCave];
            }
        }

        await resultOutputCallback(bestFlow);

    },
    {
        key: "proboscidea-volcanium",
        title: "Proboscidea Volcanium",
        supportsQuickRunning: true,
        embeddedData: true,
        exampleInput,
        stars: 2
    }
);