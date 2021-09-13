import { createIntervalPauser } from "../../../support/run";
import { modInverse } from "../../../support/algebra";
import { entryForFile } from "../../entry";

type Operation = {
    type: "cut";
    amount: number;
} | {
    type: "deal-into";
} | {
    type: "deal-increment";
    amount: number;
};

const parse = (lines: string[]): Operation[] => {
    return lines.map(l => l.trim()).filter(l => l).map(line => {
        if (line.startsWith("deal into")) {
            return {type: "deal-into"};
        } else if (line.startsWith("deal")) {
            return {type: "deal-increment", amount: parseInt(line.split(" ")[3], 10)};
        } else if (line.startsWith("cut")) {
            return {type: "cut", amount: parseInt(line.split(" ")[1], 10)};
        } else {
            throw new Error("Invalid line: " + line);
        }
    })
};

type Context = {
    module: number;
}

const executeOperation = (current: number, operation: Operation, context: Context): number => {
    const normalize = (v: number) => ((v % context.module) + context.module) % context.module;
    switch (operation.type) {
        case "cut":
            return normalize(current - operation.amount);
        case "deal-into":
            return normalize(-current - 1);
        case "deal-increment":
            return normalize(current * operation.amount);
    }
};

const executeInverseOperation = (current: bigint, operation: Operation, context: Context): bigint => {
    const mod = BigInt(context.module);
    const normalize = (v: bigint) => ((v % mod) + mod) % mod;
    switch (operation.type) {
        case "deal-into":
            return normalize(-current - 1n);
        case "cut":
            return normalize(current + BigInt(operation.amount));
        case "deal-increment":
            {
                const inverse = modInverse(BigInt(operation.amount), mod);
                return normalize(current * inverse);
            }
    }
}

export const slamShuffle = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parse(lines);
        const targetCard = 2019;
        const context: Context = {module: 10007};
        let current = targetCard;
        for (const operation of input) {
            current = executeOperation(current, operation, context);
        }
        await resultOutputCallback(current);
    },
    async ({ lines, outputCallback, resultOutputCallback, pause }) => {
        const input = parse(lines);
        input.reverse();
        const targetPosition = 3074n;
        const context: Context = {module: 119315717514047};
        const iterations = 101741582076661n;
        let current = targetPosition;
        pause = createIntervalPauser(100, pause);
        for (let i = 0n; i < iterations; i++) {
            for (const operation of input) {
                current = executeInverseOperation(current, operation, context);
                await pause();
            }
        }
        await resultOutputCallback(Number(current));
    },
    {
        key: "slam-shuffle",
        title: "Slam Shuffle",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 1
    }
);