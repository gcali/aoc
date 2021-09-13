import { createIntervalPauser } from "../../../support/run";
import { modInverse } from "../../../support/algebra";
import { entryForFile } from "../../entry";

type Coefficients = {
    a: bigint;
    b: bigint;
};

type Operation = {
    type: "cut";
    amount: bigint;
} | {
    type: "deal-into";
} | {
    type: "deal-increment";
    amount: bigint;
};

const parse = (lines: string[]): Operation[] => {
    return lines.map((l) => l.trim()).filter((l) => l).map((line) => {
        if (line.startsWith("deal into")) {
            return { type: "deal-into" };
        } else if (line.startsWith("deal")) {
            return { type: "deal-increment", amount: BigInt(parseInt(line.split(" ")[3], 10)) };
        } else if (line.startsWith("cut")) {
            return { type: "cut", amount: BigInt(parseInt(line.split(" ")[1], 10)) };
        } else {
            throw new Error("Invalid line: " + line);
        }
    });
};

type Context = {
    module: bigint;
};

const calculateCoefficients = (current: Coefficients, operation: Operation, context: Context): Coefficients => {
    const mod = context.module;
    const normalize = (v: bigint) => ((v % mod) + mod) % mod;
    switch (operation.type) {
        case "cut":
            return {
                a: current.a,
                b: normalize(current.b - operation.amount)
            };
        case "deal-into":
            return {
                a: normalize(-current.a),
                b: normalize(-current.b - 1n)
            };
        case "deal-increment":
            return {
                a: normalize(current.a * operation.amount),
                b: normalize(current.b * operation.amount)
            };
    }
};

const invertCoefficients = (current: Coefficients, context: Context): Coefficients => {
    const a_1 = modInverse(current.a, context.module);
    return {
        a: a_1,
        b: a_1 - a_1 * current.b
    };
};
const calculateInverseCoefficients = (current: Coefficients, operation: Operation, context: Context): Coefficients => {
    const mod = BigInt(context.module);
    const normalize = (v: bigint) => ((v % mod) + mod) % mod;
    const inverse = (v: bigint) => modInverse(v, mod);
    switch (operation.type) {
        case "cut":
            return {
                a: current.a,
                b: normalize(current.b + operation.amount)
            };
        case "deal-into":
            return {
                a: normalize(-current.a),
                b: normalize(-current.b - 1n)
            };
        case "deal-increment":
            return {
                a: normalize(current.a * inverse(operation.amount)),
                b: normalize(current.b * inverse(operation.amount))
            };
    }
};

const compose = (f: Coefficients, g: Coefficients, mod: bigint): Coefficients => {
    const normalize = (v: bigint) => ((v % mod) + mod) % mod;
    return {
        a: normalize(f.a * g.a),
        b: normalize(f.a * g.b + f.b)
    };
};

const compow = (f: Coefficients, mod: bigint): Coefficients => compose(f, f, mod);

export const slamShuffle = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parse(lines);
        const targetCard = 2019n;
        const context: Context = { module: 10007n };
        let current: Coefficients = { a: 1n, b: 0n };
        for (const operation of input) {
            current = calculateCoefficients(current, operation, context);
        }
        const mod = BigInt(context.module);
        const normalize = (v: bigint) => ((v % mod) + mod) % mod;
        await resultOutputCallback(Number(normalize(current.a * targetCard + current.b)));
    },
    async ({ lines, outputCallback, resultOutputCallback, pause }) => {
        const input = parse(lines);
        input.reverse();
        const targetPosition = 2020n;
        const context: Context = { module: 119315717514047n };

        let iterationCoefficients = { a: 1n, b: 0n };
        for (const operation of input) {
            iterationCoefficients = calculateInverseCoefficients(iterationCoefficients, operation, context);
        }

        const found = new Set<string>();

        const maxIterations = 101741582076661;
        let iterations = 101741582076661;
        const operands: Coefficients[] = [];
        while (iterations > 0) {
            let currentSteps = 1;
            let currentCoeff = iterationCoefficients;
            while (currentSteps * 2 <= iterations) {
                currentCoeff = compow(currentCoeff, context.module);
                currentSteps *= 2;
            }
            iterations -= currentSteps;
            operands.push(currentCoeff);
            await outputCallback(1 - iterations / maxIterations);
            await pause();
        }
        await outputCallback("------------");
        const finalOperand = operands.reduce((acc, next) => compose(acc, next, context.module));
        const mod = context.module;
        const normalize = (v: bigint) => Number(((v % mod) + mod) % mod);
        await resultOutputCallback(normalize(finalOperand.a * targetPosition + finalOperand.b));
    },
    {
        key: "slam-shuffle",
        title: "Slam Shuffle",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
    }
);
