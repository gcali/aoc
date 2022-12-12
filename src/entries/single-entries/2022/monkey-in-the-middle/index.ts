import bigInt from "big-integer";
import { buildGroups } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

type Item = {
    value: number;
    index: number;
}

class Monkey {
    /**
     *
     */

    public inspected: number = 0;

    public modulo: number | null = null;
    constructor(
        private items: Item[],
        private operation: (old: number) => number,
        public test: number,
        private to: { true: number, false: number },
        public isWorried: boolean
    ) {
    }

    public round(monkeys: Monkey[]) {
        for (const item of this.items) {
            let worry = this.operation(item.value);
            if (!this.isWorried) {
                worry = worry / 3;
            }
                if (this.modulo !== null) {
                    worry = worry % this.modulo;
                }
            const target = worry % this.test === 0 ? this.to.true : this.to.false;
            monkeys[target].items.push({value: worry, index: item.index});
            this.inspected++;
        }
        this.items = [];
    }

    public serialize() {
        const data = this.items.map(i => i.index).sort();
        return JSON.stringify(data);
    }

    public toString() {
        return this.items.join(", ");
    }
}

const serialize = (monkeys: Monkey[]) => monkeys.map(m => m.serialize()).join("_");

const parseInput = (lines: string[]): Monkey[] => {
    const grouped = buildGroups(lines, 6, 7);
    const result: Monkey[] = [];
    const getLast = (line: string) => {
        const tokenized = line.split(" ");
        return tokenized[tokenized.length - 1];
    }
    let prefix = 0;
    for (const group of grouped) {
        const startingStart = group[1].indexOf(":");
        const items = group[1].slice(startingStart + 2).split(", ").map(e => parseInt(e, 10));
        const rawoperand = getLast(group[2]);
        let operation = (old: number) => old.valueOf();
        if (rawoperand === "old") {
            operation = (old: number) => old.valueOf() * old.valueOf();
        } else {
            const operand = parseInt(rawoperand, 10);
            operation = (old: number) => (group[2].includes("*") ? old * operand : old + operand);
        }
        const testN = parseInt(getLast(group[3]), 10);
        const target = {
            true: parseInt(getLast(group[4]), 10),
            false: parseInt(getLast(group[5]), 10)
        }
        result.push(new Monkey(
            items.map((item, index) => ({value: item, index: prefix * 100 + index})),
            operation,
            testN,
            target,
            false
        ));
        prefix++;
    }
    return result;
}

export const monkeyInTheMiddle = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const monkeys = parseInput(lines);

        let modulo = 1;

        for (const monkey of monkeys) {
            modulo *= monkey.test;
        }

        for (const monkey of monkeys) {
            monkey.modulo = modulo;
        }



        for (let i = 0; i < 20; i++) {
            for (const monkey of monkeys) {
                monkey.round(monkeys);
            }

        }

        monkeys.sort((a, b) => b.inspected - a.inspected);
        await resultOutputCallback(monkeys[0].inspected * monkeys[1].inspected);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const monkeys = parseInput(lines);

        for (const monkey of monkeys) {
            monkey.isWorried = true;
        }
        let modulo = 1;

        for (const monkey of monkeys) {
            modulo *= monkey.test;
        }

        for (const monkey of monkeys) {
            monkey.modulo = modulo;
        }

        for (let i = 0; i < 10000; i++) {
            for (const monkey of monkeys) {
                monkey.round(monkeys);
            }
        }

        monkeys.sort((a, b) => b.inspected - a.inspected);
        await resultOutputCallback(monkeys[0].inspected * monkeys[1].inspected);
    },
    {
        key: "monkey-in-the-middle",
        title: "Monkey in the Middle",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);