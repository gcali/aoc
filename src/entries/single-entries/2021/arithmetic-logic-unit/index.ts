import { entryForFile } from "../../../entry";

type AluState = {
    w: number;
    x: number;
    y: number;
    z: number;
};

type Register = keyof AluState & ("w" | "x" | "y" | "z");

const isRegister = (s: string | (Register | number)): s is Register => {
    return ["w", "x", "y", "z"].includes(s as string);
};

const asNumber = (s: string): number | null => {
    const n = parseInt(s, 10);
    if (Number.isNaN(n)) {
        return null;
    }
    if (n.toString() !== s) {
        return null;
    }
    return n;
};

type BaseInstruction = {
    a: Register
};

type SingleInstruction = BaseInstruction & {
    type: "inp",
    b?: undefined
};

type DoubleInstruction = BaseInstruction & {
    b: Register | number
} & ({
    type: "add"
} | {
    type: "mul"
} | {
    type: "div"
} | {
    type: "mod"
} | {
    type: "eql"
});

type Instruction = SingleInstruction | DoubleInstruction;

const parse = (lines: string[]): Instruction[] => {
    return lines.map((line: string): Instruction => {
        const tokens = line.split(" ");
        const type = tokens[0];
        if (type !== "inp" && type !== "mul" && type !== "div" && type !== "mod" && type !== "eql" && type !== "add") {
            throw new Error("Invalid instruction " + type);
        }
        const target = tokens[1];
        if (target !== "w" && target !== "x" && target !== "y" && target !== "z") {
            throw new Error("Invalid target " + target);
        }
        if (type === "inp") {
            return {
                type,
                a: target
            };
        } else {
            const b = isRegister(tokens[2]) ? tokens[2] : asNumber(tokens[2]);
            if (b === null) {
                throw new Error("Invalid b " + tokens[2]);
            }
            return {
                type,
                a: target,
                b
            };
        }
    });
};

const translate = (instructions: Instruction[]): string[] => {
    let i = 0;
    const certainZero = new Set<Register>();
    certainZero.add("w");
    certainZero.add("x");
    certainZero.add("y");
    certainZero.add("z");
    return instructions.map((instr: Instruction): string | null => {
        const isBZero = instr.type !== "inp" && ((isRegister(instr.b) && certainZero.has(instr.b)) || instr.b === 0);
        switch (instr.type) {
            case "inp":
                certainZero.delete(instr.a);
                return `${instr.a} = MONAD[${i++}];`;
            case "div":
                if (certainZero.has(instr.a)) {
                    return null;
                }
                return `${instr.a} = Math.trunc(${instr.a}/${instr.b});`;
            case "eql":
                certainZero.delete(instr.a);
                return `${instr.a} = (${instr.a} === ${instr.b} ? 1 : 0);`;
            case "mod":
                if (certainZero.has(instr.a)) {
                    return null;
                }
                return `${instr.a} %= ${instr.b};`;
            case "mul":
                if (certainZero.has(instr.a)) {
                    return null;
                }
                if (isBZero) {
                    certainZero.add(instr.a);
                    return `${instr.a} = 0;`;
                } else {
                    return `${instr.a} *= ${instr.b};`;
                }
            case "add":
                if (certainZero.has(instr.a)) {
                    if (!isBZero) {
                        certainZero.delete(instr.a);
                    }
                    return `${instr.a} = ${instr.b}`;
                } else {
                    if (!isBZero) {
                        certainZero.delete(instr.a);
                    }
                    return `${instr.a} += ${instr.b};`;
                }
        }
    }).filter((s) => s !== null).map((s) => s as string);
};

export const arithmeticLogicUnit = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const instructions = parse(lines);
        const js = translate(instructions);
        console.log(instructions.length / 18);
        for (let j = 0; j < 18; j++) {
            const matching: string[] = [];
            for (let i = 0; i < 14; i++) {
                matching.push(lines[j + i * 18]);
            }
            console.log(matching);
        }
        // const MONAD = [];
        // for (let i = 0; i < 14; i++) {
        //     MONAD.push(1);
        // }
        // console.log(`const MONAD = ${JSON.stringify(MONAD)};`);
        // for (const reg of ["x", "y", "z", "w"]) {
        //     console.log(`let ${reg} = 0;`);
        // }
        // js.forEach((l) => console.log(l));
        // console.log(`console.log(z});`);

        // console.log("---");
        // js.filter((l) => l.startsWith("z")).forEach((l) => console.log(l));
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = lines.map((l) => parseInt(l, 10));
        const result: any = 0;
        for (const x of lines) {
        }
        for (const x of ns) {
        }
        await resultOutputCallback(result);
    },
    {
        key: "arithmetic-logic-unit",
        title: "Arithmetic Logic Unit",
        supportsQuickRunning: true,
        embeddedData: true
    }
);
