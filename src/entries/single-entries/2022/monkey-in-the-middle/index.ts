import bigInt from "big-integer";
import { buildGroups } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";

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

    const getLast = (line: string) => {
        const tokenized = line.split(" ");
        return tokenized[tokenized.length - 1];
    }

    let prefix = 0;

    const parser = new Parser(lines)
        .group("")
        .groupMap(p => 
            p.startLabeling()
            .label(id => id.n(), "id")
            .label(items => items
                .transform(/: .*/)
                .tokenize(", ")
                .asNumbers()
                .run(),
                "items"
            )
            .label(rawLine => {
                const line = rawLine.s();
                const rawoperand = getLast(line);
                let operation = (old: number) => old.valueOf();
                if (rawoperand === "old") {
                    operation = (old: number) => old.valueOf() * old.valueOf();
                } else {
                    const operand = parseInt(rawoperand, 10);
                    operation = (old: number) => (line.includes("*") ? old * operand : old + operand);
                }
                return operation;

            }, "operation")
            .label(testN => testN.n(), "testN")
            .label(t => t.n(), "true")
            .label(t => t.n(), "false")
            .run()
        )
        .map((e, monkeyIndex) => {
            return new Monkey(
            e.items.map((item, index) => ({value: item, index: monkeyIndex * 100 + index})),
            e.operation, 
            e.testN, {
                true: e.true, false: e.false
            }, false);
        })
        .run();

    return parser;
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