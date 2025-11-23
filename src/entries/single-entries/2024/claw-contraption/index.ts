import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { calculateExtended } from "../../../../support/algebra";

type Diophantine = {
    a: number;
    b: number;
    c: number;
};

type DiophantineSystem = [Diophantine, Diophantine];

/*
a1x + b1y = c1
a2x + b2y = c2

x = (c1-b1y)/a1
a2(c1-b1y)/a1 + b2y = c2
a2c1/a1 - a2b1y/a1 + b2a1y/a1 = c2
c2 - a2c1/a1 = (b2a1-a2b1)y/a1
a1c2 - a2c1 = (b2a1-a2b1)y
(a1c1-a2c1)/b2a1-a2b1 = y

x = (c1b1)(a1c1-a1c1)/(a1(b2a1-a2b1))

*/

const solveSystem = (s: DiophantineSystem): {x: number, y: number} | null => {
    const x = (s[0].c * s[1].b - s[0].b * s[1].c) / (s[0].a*s[1].b - s[0].b*s[1].a);
    const y = (s[0].a * s[1].c - s[0].c * s[1].a) / (s[0].a * s[1].b - s[0].b * s[1].a);
    if (Number.isInteger(x) && Number.isInteger(y)) {
        return {x, y};
    } else {
        return null;
    }
}

// Button A: X+22, Y+26
// Button B: X+93, Y+23
// Prize: X=7306, Y=3246

// Button A: X+40, Y+26
// Button B: X+13, Y+42
// Prize: X=17433, Y=2622


const calculateCost = (s: DiophantineSystem): number => {
    const solutions = solveSystem(s);
    if (!solutions) {
        return 0;
    }
    const {x, y} = solutions;
    return x * 3 + y * 1;
}


export const clawContraption = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = parseInput(lines);
        await resultOutputCallback(ns.reduce((acc, next) => {
            return acc + calculateCost(next);
        }, 0))
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = parseInput(lines, 10000000000000);
        await resultOutputCallback(ns.reduce((acc, next) => {
            return acc + calculateCost(next);
        }, 0))
    },
    {
        key: "claw-contraption",
        title: "Claw Contraption",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 13,
        stars: 2,
        exampleInput: `Button A: X+94, Y+34
Button B: X+22, Y+67
Prize: X=8400, Y=5400

Button A: X+26, Y+66
Button B: X+67, Y+21
Prize: X=12748, Y=12176

Button A: X+17, Y+86
Button B: X+84, Y+37
Prize: X=7870, Y=6450

Button A: X+69, Y+23
Button B: X+27, Y+71
Prize: X=18641, Y=10279`
    }
);

function parseInput(lines: string[], delta = 0) {
    return new Parser(lines)
        .group("")
        .groupMap(e => {
            const flat = e.extractAllNumbers().flat().run();
            return [{
                a: flat[0],
                b: flat[2],
                c: flat[4] + delta,
            }, {
                a: flat[1],
                b: flat[3],
                c: flat[5] + delta
            }] as DiophantineSystem;
        })
        .run();
}
