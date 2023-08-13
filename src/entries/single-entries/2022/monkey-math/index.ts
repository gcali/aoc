import { entryForFile } from "../../../entry";

const exampleInput = 
`root: pppw + sjmn
dbpl: 5
cczh: sllz + lgvd
zczc: 2
ptdq: humn - dvpt
dvpt: 3
lfqf: 4
humn: 5
ljgn: 2
sjmn: drzm * dbpl
sllz: 4
pppw: cczh / lfqf
lgvd: ljgn * ptdq
drzm: hmdt - zczc
hmdt: 32`;

type Monkey = {
    name: string;
    instruction: number | Operation;
}

type Operation = {
    a: string;
    b: string;
    operator: Operator;
};

type Operator ="*" | "+" | "/" | "-" ;

const invertOperator = (op: Operator): Operator => {
    if (op === "*") {
        return "/";
    } else if (op === "+") {
        return "-";
    } else if (op === "-") {
        return "+";
    } else if (op === "/") {
        return "*";
    } else {
        throw new Error("Invalid operator " + op);
    }
}

type Results = {[key: string]: number | null}
type MonkeyLookup = {[key: string]: Monkey}

const parseLines = (lines: string[]): {monkeys: Monkey[], lookup: MonkeyLookup} => {
    const monkeys = lines.map(line => {
        const [name, rest] = line.split(": ");
        if (parseInt(rest, 10).toString() === rest) {
            return {name, instruction: parseInt(rest, 10)} as Monkey;
        } else {
            const [a,operator,b] = rest.split(" ");
            if (operator !== "*" && operator !== "+" && operator !== "/" && operator !== "-") {
                throw new Error("Invalid operator");
            }
            return {name, instruction: {a,b,operator}} as Monkey;
        }
    });
    const lookup: MonkeyLookup = {};
    for (const m of monkeys) {
        lookup[m.name] = m;
    }
    return {monkeys, lookup};
}

const invertMonkey = (find: string, monkey: Monkey): Monkey => {
    if (typeof monkey.instruction === "number") {
        return monkey;
    }
    if (monkey.instruction.a === find) {
        return {
            name: find,
            instruction: {
                operator: invertOperator(monkey.instruction.operator),
                a: monkey.name,
                b: monkey.instruction.b
            }
        }
    } else if (monkey.instruction.b === find) {
        return {
            name: find,
            instruction: {
                operator: invertOperator(monkey.instruction.operator),
                a: monkey.name,
                b: monkey.instruction.a
            }
        }
    } else {
        throw new Error("Cannnot invert the monkey");
    }
}

const calculate = (
    name: string, 
    results: Results, 
    instructions: Monkey[], 
    lookup: MonkeyLookup,
    options?: {errorOnHuman?: boolean, oldCalculator?: (label: string) => number | null}
): number | null => {
    if (options?.errorOnHuman === true && name === "humn") {
        return null;
    }
    if (results[name] !== undefined) {
        return results[name];
    }

    const monkey = lookup[name];


    if (!monkey) {
        if (options?.oldCalculator) {
            const r = options.oldCalculator(name);
            if (r !== null) {
                return r;
            }
        }
        throw new Error("Could not find instruction " + name);
    }

    if (typeof monkey.instruction === "number") {
        results[name] = monkey.instruction;
        return monkey.instruction;
    }

    const a = calculate(monkey.instruction.a, results, instructions, lookup, options);
    const b = calculate(monkey.instruction.b, results, instructions, lookup, options);

    const o = monkey.instruction.operator;
    let res = null;
    if (a === null || b === null) {

    } else if (o === "*") {
        res= a * b;
    } else if (o === "+") {
        res = a + b;
    } else if (o === "-") {
        res = a - b;
    } else {
        res = Math.floor(a/b);
    }
    results[monkey.name] = res;
    return res;
}

export const monkeyMath = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const {monkeys, lookup} = parseLines(lines);
        const res = calculate("root", {}, monkeys, lookup);
        await resultOutputCallback(res);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const {monkeys, lookup} = parseLines(lines);
        const root = lookup["root"];
        const newMonkeys: Monkey[] = [];
        let target = "humn";
        while (true) {
            const humns = monkeys.filter(m => typeof m.instruction !== "number" && [m.instruction.a,m.instruction.b].includes(target));
            if (humns.length !== 1) {
                throw new Error("Cannot invert: " + humns.length);
            }
            const [current] = humns;
            const newMonkey = invertMonkey(target, current);
            newMonkeys.push(newMonkey);
            target = current.name;
            if (target === "root") {
                break;
            }
        }

        for (const monkey of monkeys) {
            if (monkey.name !== "humn" && typeof monkey.instruction === "number") {
                newMonkeys.push(monkey);
            }
        }
        const newRoot = newMonkeys.filter(e => e.name === "humn")[0];
        if (typeof root.instruction === "number") {
            throw new Error("Yeah, no");
        }
        const aResults = {};
        const bResults = {};
        const a = calculate(root.instruction.a, aResults, monkeys, lookup, {errorOnHuman: true});
        const b = calculate(root.instruction.b, bResults, monkeys, lookup, {errorOnHuman: true});
        let results: Results = {};
        if (a === null) {
            results["root"] = b;
            // results[root.instruction.b] = b;
            // results[root.instruction.a] = b;
        } else {
            results["root"] = a;
            // results[root.instruction.a] = a;
            // results[root.instruction.b] = a;
        }

        console.log(a, b);

        console.log(results);

        const newLookup: MonkeyLookup = {};
        for (const m of newMonkeys) {
            newLookup[m.name] = m;
        }

        const oldCalculator = (() => ((label: string) => {
            const res = {};
            return calculate(label, res, monkeys, lookup, {errorOnHuman: true});
        }))();

        const res = calculate("humn", results, newMonkeys, newLookup, {oldCalculator});

        if (!res) {
            throw new Error("Cannot calculate");
        }

        monkeys.filter(m => m.name === "humn").forEach(e => e.instruction = res);

        const newRes = calculate("root", {}, monkeys, lookup);
        const limit = 6655937950880;
        const [humn] = monkeys.filter(e => e.name === "humn");
        console.log(humn);
        console.log(lookup["root"]);
        const as = calculate("gqjg", {}, monkeys, lookup);
        for (let i = 10; i < limit; i++) {
            humn.instruction = i;
            const b = calculate("rpjv", {}, monkeys, lookup);
            if (as === b) {
                await resultOutputCallback(i);
                return;
            } else if (i % 100000 === 0) {
                console.log(i/limit);
            }
        }
        console.log(calculate("root", {}, monkeys, lookup));
        console.log(calculate("gqjg", {}, monkeys, lookup));
        console.log(calculate("rpjv", {}, monkeys, lookup));

        await resultOutputCallback(res);
    },
    {
        key: "monkey-math",
        title: "Monkey Math",
        supportsQuickRunning: true,
        embeddedData: true,
        exampleInput
    }
);