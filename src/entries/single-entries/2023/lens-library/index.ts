import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";

const hash = (s: string) => {
    let result = 0;
    for (const c of s) {
        const ascii = c.charCodeAt(0);
        result += ascii;
        result *= 17;
        result %= 256;
    }
    return result;
}

type Lens = {
    label: string;
    focus: number;
}

type Instruction = {
    label: string;
} & ({
    type: "-"
} | { type: "=", focus: number })

class Boxes {
    private readonly boxes: Map<string, number>[] = [];
    constructor() {
        for (let i = 0; i < 256; i++) {
            this.boxes.push(new Map<string, number>());
        }
    }

    public remove(label: string) {
        const index = this.getIndex(label);
        const map = this.boxes[index];
        if (map.has(label)) {
            map.delete(label);
        }
    }

    public add(label: string, focus: number) {
        const index = this.getIndex(label);
        const map = this.boxes[index];
        map.set(label, focus);
    }

    public getScore(): number {
        let result = 0;
        for (let i = 0; i < this.boxes.length; i++) {
            let j = 1;
            for (const [label, focus] of this.boxes[i]) {
                if (j === 1) {
                    console.log("Box " + i);
                }
                console.log(`\t${label} - ${focus}`);
                result += (i + 1) * j * focus;
                j++;
            }
        }
        return result;
    }

    private getIndex(label: string) {
        return hash(label);
    }
}

const boxes = [];

export const lensLibrary = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .tokenize(",")
            .run()[0];
        let result = 0;
        for (let i = 0; i < ns.length; i++) {
            const x = hash(ns[i]);
            result += x;
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .tokenize(",")
            .run()[0];
        const boxes = new Boxes();

        for (const instruction of ns) {
            const match = /(\w+)[-=](\d*)/.exec(instruction);
            if (!match) {
                throw new Error("Invalid input: " + instruction);
            }
            const [_, label, rawFocus] = match;
            if (instruction.includes("-")) {
                boxes.remove(label);
            } else if (instruction.includes("=")) {
                const focus = parseInt(rawFocus, 10);
                if (Number.isNaN(focus)) {
                    throw new Error("Invalid focus: " + rawFocus);
                }
                boxes.add(label, focus);
            } else {
                throw new Error("Invalid instruction");
            }
        }

        await resultOutputCallback(boxes.getScore());
    },
    {
        key: "lens-library",
        title: "Lens Library",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 15,
        stars: 2,
        exampleInput: `rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7`
    }
);