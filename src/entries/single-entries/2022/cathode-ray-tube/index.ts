import { FixedSizeMatrix } from "../../../../support/matrix";
import { entryForFile } from "../../../entry";

type Instruction = {
    type: "noop"
} | {
    type: "add",
    value: number
};

type State = {
    cycle: number;
    x: number;
};

const parseInput = (lines: string[]): Instruction[] => 
    lines.map(line => {
        const [token, rest] = line.split(" ");
        if (token === "noop") {
            return {
                type: "noop"
            };
        } else if (token === "addx") {
            return {
                type: "add",
                value: parseInt(rest, 10)
            };
        } else {
            throw new Error("Invalid token " + token);
        }
    });

class CPU {
    private cycle = 0;
    private x = 1;

    public *run(instruction: Instruction): Iterable<State>  {
        if (instruction.type === "noop") {
            this.cycle++;
            yield {
                cycle: this.cycle,
                x: this.x
            };
        } else {
            this.cycle++;
            yield {
                cycle: this.cycle,
                x: this.x
            };
            this.cycle++;
            yield {
                cycle: this.cycle,
                x: this.x
            };
            this.x += instruction.value;
        }
    }


}

export const cathodeRayTube = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const instructions = parseInput(lines);
        const cpu = new CPU();

        const interesting = [];

        for(const instruction of instructions) {
            for (const state of cpu.run(instruction)) {
                // await outputCallback(state);
                if ((state.cycle - 20) % 40 === 0) {
                    interesting.push(state.cycle * state.x);
                }
            }
        }
        // await outputCallback(interesting);
        await resultOutputCallback(interesting.reduce((acc, next) => acc + next, 0));

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const instructions = parseInput(lines);
        const cpu = new CPU();

        const size = {x: 40, y: 6};


        const output = new FixedSizeMatrix<"#">(size);

        for(const instruction of instructions) {
            for (const state of cpu.run(instruction)) {
                const index = (state.cycle - 1) % 240;
                const y = Math.floor(index / 40);
                const x = index % 40;
                if (state.x >= x - 1 && state.x <= x + 1) {
                    output.set({x, y}, "#");
                }
            }
        }
        await resultOutputCallback(output.toString(e => e || "."));
    },
    {
        key: "cathode-ray-tube",
        title: "Cathode-Ray Tube",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);