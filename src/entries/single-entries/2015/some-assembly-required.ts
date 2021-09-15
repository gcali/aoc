import { entryForFile } from "../../entry";

type State = Map<string, number>;

type Operation = {
    operator: "NOT",
    input: number | string;
} | {
    operator: "AND",
    a: string | number;
    b: string;
} | {
    operator: "OR",
    a: string;
    b: string;
} | {
    operator: "RSHIFT",
    input: string;
    amount: number;
} | {
    operator: "LSHIFT",
    input: string,
    amount: number
} | {
    operator: "VALUE",
    amount: number | string
};

interface InputLine {
    destination: string;
    operation: Operation;
}

const parseInput = (lines: string[]): InputLine[] => {
    const parsed: InputLine[] = lines.map((line) => {
        const [left, destination] = line.split(" -> ");
        const tokens = left.split(" ");
        if (tokens[0] === "NOT") {
            return {
                destination,
                operation: {
                    operator: "NOT",
                    input: parseNumberOrString(tokens[1])
                }
            };
        }
        switch (tokens[1]) {
            case "OR":
                return {
                    destination,
                    operation: {
                        operator: "OR",
                        a: tokens[0],
                        b: tokens[2]
                    }
                };
            case "AND":
                return {
                    destination,
                    operation: {
                        operator: "AND",
                        a: parseNumberOrString(tokens[0]),
                        b: tokens[2]
                    }
                };
            case "RSHIFT":
                return {
                    destination,
                    operation: {
                        operator: "RSHIFT",
                        input: tokens[0],
                        amount: parseInt(tokens[2], 10)
                    }
                };
            case "LSHIFT":
                return {
                    destination,
                    operation: {
                        operator: "LSHIFT",
                        input: tokens[0],
                        amount: parseInt(tokens[2], 10)
                    }
                };
            default:
                return {
                    destination,
                    operation: {
                        operator: "VALUE",
                        amount: parseNumberOrString(tokens[0])
                    }
                };
        }
    });
    return parsed;
};

const parseNumberOrString = (s: string): number | string => {
    const parsed = parseInt(s, 10);
    const isNumber = parsed.toString() === s;
    return isNumber ? parsed : s;
};

const calculate = (wire: string | number, state: State, input: InputLine[]): number => {
    if (typeof(wire) !== "string") {
        return wire;
    }
    if (state.has(wire)) {
        return state.get(wire)!;
    }
    const [rule] = input.filter((line) => line.destination === wire);
    if (!rule) {
        throw new Error("Cannot parse rule for: " + wire);
    }
    const value = handleOperation(rule, state, input);
    if (Number.isNaN(value)) {
        throw new Error("Got none from: " + JSON.stringify(rule));
    }
    state.set(wire, value);
    return value;

};

const handleOperation = (rule: InputLine, state: State, input: InputLine[]): number => {
    switch (rule.operation.operator) {
        case "VALUE": {
                if (typeof(rule.operation.amount) === "string") {
                    return calculate(rule.operation.amount, state, input);
                } else {
                    return rule.operation.amount;
                }
            }
        case "AND": {
                const a = calculate(rule.operation.a, state, input);
                const b = calculate(rule.operation.b, state, input);
                return a & b;
            }
        case "OR": {
                const a = calculate(rule.operation.a, state, input);
                const b = calculate(rule.operation.b, state, input);
                return a | b;
            }
        case "LSHIFT": {
                const i = calculate(rule.operation.input, state, input);
                return i << calculate(rule.operation.amount, state, input);
            }
        case "RSHIFT": {
                const i = calculate(rule.operation.input, state, input);
                return i >>> calculate(rule.operation.amount, state, input);
            }
        case "NOT": {
                const i = calculate(rule.operation.input, state, input);
                return ~i;
            }
    }
};

export const someAssemblyRequired = entryForFile(
    async ({ lines, outputCallback }) => {
        const state = new Map<string, number>();
        const input = parseInput(lines);
        const value = calculate("a", state, input);
        await outputCallback(value);
    },
    async ({ lines, outputCallback }) => {
        const state = new Map<string, number>();
        const input = parseInput(lines);
        const value = calculate("a", state, input);
        const newInput: InputLine[] = input.map((line) => line.destination === "b" ? {
            ...line,
            operation: {
                operator: "VALUE",
                amount: value
            }
        } : line);
        const newValue = calculate("a", new Map<string, number>(), newInput);
        await outputCallback(newValue);
    },
    { key: "some-assembly-required", title: "Some Assembly Required", stars: 2, embeddedData: true}
);
