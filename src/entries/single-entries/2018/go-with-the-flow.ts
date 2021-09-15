import { entryForFile } from "../../entry";
import { groupBy } from "../../../support/sequences";
import { Machine, Instruction, OpCode } from "./chronal-classification";

export const entry = entryForFile(
    async ({ lines, outputCallback, pause, isCancelled }) => {
        const pointer = parseInt(lines[0][4], 10);
        let machine = new Machine([0, 0, 0, 0, 0, 0], pointer);
        const instructions = Instruction.fromLines(lines.slice(1), (s) => s as OpCode);
        let iterations = 0;
        while (machine.isExecutable(instructions.length)) {
            const instruction = instructions[machine.nextInstructionAddress];
            const oldMachine = machine;
            machine = machine.execute(instruction);
            const modVal = (++iterations) % 56197;
            if (modVal <= 30) {
                await outputCallback(`{${oldMachine.nextInstructionAddress}} ${JSON.stringify(oldMachine.registers)} | ${instruction} -> ${JSON.stringify(machine.registers)} => [${machine.instructionPointerRegister}] ${machine.nextInstructionAddress}`);
            } else if (modVal === 31) {
                await outputCallback(null);
            } else if (iterations % 100 === 0) {
                await pause();
            }
            if (isCancelled && isCancelled()) {
                await outputCallback("Stopped!");
                break;
            }
        }
        await outputCallback(`Result: ${machine.registers[0]}`);
    },
    async ({ lines, outputCallback, pause, isCancelled }) => {
        const pointer = parseInt(lines[0][4], 10);
        let machine = new Machine([1, 0, 0, 0, 0, 0], pointer);
        const instructions = Instruction.fromLines(lines.slice(1), (s) => s as OpCode);
        let iterations = 0;
        const print = 30;
        // const iterationBatch = 56197;
        const iterationBatch = 1;
        while (machine.isExecutable(instructions.length)) {
            const instruction = instructions[machine.nextInstructionAddress];
            if (machine.nextInstructionAddress === 1) {
                await outputCallback({registers: machine.registers});
                break;
            }
            const oldMachine = machine;
            machine = machine.execute(instruction);
            const modVal = (++iterations) % iterationBatch;
            if (modVal <= print) {
                await outputCallback(`{${oldMachine.nextInstructionAddress}} ${JSON.stringify(oldMachine.registers)} | ${instruction} -> ${JSON.stringify(machine.registers)} => [${machine.instructionPointerRegister}] ${machine.nextInstructionAddress}`);
            } else if (modVal === print + 1) {
                await outputCallback(null);
            } else if (iterations % 100 === 0) {
                await pause();
            }
            if (isCancelled && isCancelled()) {
                await outputCallback("Stopped!");
                break;
            }
        }
        await outputCallback(`Result: ${machine.registers[0]}`);

        // by looking at the code, it calculates the sum of divisors; here's the one I used, translated:
        /*
 0 goto 17
 1 b = 1
 2 c = 1
 3 e = b * c
 4 eqrr e = (e == d)
 5 goto 6 + e
 6 goto 8
 7 a = a + b
 8 c++
 9 e = c > d
10 goto 11 + e
11 goto 3
12 b++
13 e = b > d
14 goto 15 + e
15 goto 2
16 exit
17 d = d + 2
18 d = d * d
19 d = 19 * d
20 d = d * 11
21 e = e + 8
22 e = e * 22
23 e = e + 13
24 d = e + d
25 goto 26 + a
26 goto 1
27 e = 27
28 e = e * 28
29 e = e + 29
30 e = e * 30
31 e = e * 14
32 e = e * 32
33 d = e + d
34 a = 0
35 goto 1
        */

        // the setup of the values is the one in lines 27-34 (the first entry used 17-24); then it's just a question
        // of calculating sum of divisors, I used the console directly, here's the function:
        /*
let divisorSum = (c) => {
    let sum = 0;
    for (let i = 1; i <= c; i++) {
        if (c % i === 0) {
            sum += i;
        }
    }
    return sum;
}
        */
    },
    {
        key: "go-with-the-flow",
        title: "Go with the flow",
        stars: 2,
        customComponent: "pause-and-run",
        embeddedData: "go-with-the-flow/go-with-the-flow"
    }
);
