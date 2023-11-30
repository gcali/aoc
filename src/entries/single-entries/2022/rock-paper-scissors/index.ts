import { entryForFile } from "../../../entry";

type RPS = "A" | "B" | "C";
type Strategy = "X" | "Y" | "Z";

type Mapper = (e: Strategy) => RPS;

const beatenBy = {
    A: "B" as RPS,
    B: "C" as RPS,
    C: "A" as RPS
};

const beats = {
    B: "A" as RPS,
    C: "B" as RPS,
    A: "C" as RPS
};


const choose = (a: RPS, b: Strategy): RPS => {
    if (b === "X") {
        return beats[a];
    } else if (b === "Y") {
        return a;
    } else {
        return beatenBy[a];
    }
};


const pointCalculator = (a: RPS, b: RPS): number => {
    const basePoints = {
        A: 1,
        B: 2,
        C: 3
    };

    const points = basePoints[b];

    if (a === b) {
        return points + 3;
    }
    if (beatenBy[b] === a) {
        return points;
    }
    return points + 6;
};


export const rockPaperScissors = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const data = lines.map((l) => {
            const [a, b] = l.split(" ");
            return {
                opp: a as RPS,
                mine: b as Strategy
            };
        });

        const all = ["A", "B", "C"] as RPS[];

        const mapper = (e: Strategy): RPS => {
            const trans = {
                X: all[0],
                Y: all[1],
                Z: all[2]
            };
            return trans[e];
        };

        let points = 0;
        for (const e of data) {
            const current = pointCalculator(e.opp, mapper(e.mine));
            points += current;
            if (Number.isNaN(points)) {
                console.error(current, e);
                throw new Error("What happened?");
            }
        }

        await resultOutputCallback(points);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const data = parseInput(lines);

        let points = 0;
        for (const e of data) {
            points += pointCalculator(e.opp, choose(e.opp, e.mine));
        }

        await resultOutputCallback(points);
    },
    {
        key: "rock-paper-scissors",
        title: "Rock Paper Scissors",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);

function parseInput(lines: string[]) {
    return lines.map((l) => {
        const [a, b] = l.split(" ");
        return {
            opp: a as RPS,
            mine: b as Strategy
        };
    });
}

