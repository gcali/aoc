import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";

type Calibration = {
    result: number;
    values: number[];
}

type Operator = "*" | "+" | "||";

export const bridgeRepair = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseInput(lines);
        const valid = input.filter(e => isValid(e, ["*", "+"])).map(e => e.result);
        const sum = valid.reduce((acc, next) => acc + next, 0);
        await resultOutputCallback(sum);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseInput(lines);
        const valid = input.filter(e => isValid(e, ["*", "+", "||"])).map(e => e.result);
        const sum = valid.reduce((acc, next) => acc + next, 0);
        await resultOutputCallback(sum);
    },
    {
        key: "bridge-repair",
        title: "Bridge Repair",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 7,
        stars: 2,
        exampleInput: exampleInput
    }
);

const evaluate = (a: number, b: number, operator: Operator) => {
    switch (operator) {
        case "*":
            return a * b;
        case "+":
            return a + b;
        case "||":
            return parseInt(a.toString() + b.toString(), 10);
    }
}

const parseInput = (lines: string[]): Calibration[] => {
    const ns = new Parser(lines)
        .extractAllNumbers()
        .run();
    return ns.map(e => ({
        result: e[0],
        values: e.slice(1)
    }));
}

const recursiveSearch = (calibration: Calibration, index: number, currentValue: number, operators: Operator[]): boolean => {
    if (index >= calibration.values.length) {
        return currentValue === calibration.result;
    }
    const nextValue = calibration.values[index];
    for (const operator of operators) {
        const candidateResult = evaluate(currentValue, nextValue, operator);
        if (calibration.result < candidateResult) {
            continue;
        }
        if (recursiveSearch(calibration, index+1, candidateResult, operators)) {
            return true;
        }
    }
    return false;
}

const isValid = (calibration: Calibration, operators: Operator[]): boolean => {
    return recursiveSearch(calibration, 1, calibration.values[0], operators);
}