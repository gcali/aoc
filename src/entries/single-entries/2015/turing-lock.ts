import { entryForFile } from "../../entry";
import { exec } from "child_process";

type Register = "a" | "b";

type TuringInstruction =
    { instruction: "hlf", arg: Register } |
    { instruction: "tpl", arg: Register } |
    { instruction: "inc", arg: Register } |
    { instruction: "jmp", arg: number } |
    { instruction: "jie", args: [Register, number] } |
    { instruction: "jio", args: [Register, number] };

interface State {
    a: number;
    b: number;
    ir: number;
}

type Program = TuringInstruction[];

const createStartState = (): State => {
    return {
        a: 0,
        b: 0,
        ir: 0
    };
};

const parse = (lines: string[]): Program => {
    return lines
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .map((l) => ({
            instr: l.slice(0, 3),
            args: l.slice(4).split(", ")
        }))
        .map((e) => {
            if (
                e.instr === "hlf" ||
                e.instr === "tpl" ||
                e.instr === "inc"
            ) {
                return {
                    instruction: e.instr,
                    arg: e.args[0] as Register
                } as TuringInstruction;
            } else if (e.instr === "jmp") {
                return {
                    instruction: "jmp",
                    arg: parseInt(e.args[0], 10)
                } as TuringInstruction;
            } else if (e.instr === "jie" || e.instr === "jio") {
                return {
                    instruction: e.instr,
                    args: [
                        e.args[0] as Register,
                        parseInt(e.args[1], 10)
                    ]
                } as TuringInstruction;
            } else {
                throw new RangeError("Invalid instruction " + e.instr);
            }
        });
};

const executeInstruction = (instruction: TuringInstruction, state: State) => {
    let newIr = state.ir + 1;
    switch (instruction.instruction) {
        case "hlf":
            state[instruction.arg] = Math.floor(state[instruction.arg] / 2);
            break;
        case "tpl":
            state[instruction.arg] *= 3;
            break;
        case "inc":
            state[instruction.arg]++;
            break;
        case "jmp":
            newIr = state.ir + instruction.arg;
            break;
        case "jie":
            if (state[instruction.args[0]] % 2 === 0) {
                newIr = state.ir + instruction.args[1];
            }
            break;
        case "jio":
            if (state[instruction.args[0]] === 1) {
                newIr = state.ir + instruction.args[1];
            }
            break;
    }
    state.ir = newIr;
};

const execute = (program: Program, state: State) => {
    while (state.ir >= 0 && state.ir < program.length) {
        executeInstruction(program[state.ir], state);
    }
};

export const turingLock = entryForFile(
    async ({ lines, outputCallback }) => {
        const program = parse(lines);
        const state = createStartState();
        execute(program, state);
        await outputCallback(state.b);
    },
    async ({ lines, outputCallback }) => {
        const program = parse(lines);
        const state = createStartState();
        state.a = 1;
        execute(program, state);
        await outputCallback(state.b);
    },
    { key: "turing-lock", title: "Opening the Turing Lock", stars: 2, embeddedData: true }
);
